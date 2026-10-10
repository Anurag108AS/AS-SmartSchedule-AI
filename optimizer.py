from ortools.sat.python import cp_model


def optimize_timetable(data):
    """
    Generate or optimize a college timetable.

    Required input:
        subjects: list of subjects and lecture counts
        teachers: list of teachers
        rooms: list of classrooms
        student_groups: list of student groups
        days: available days
        slots: available time slots

    Optional input:
        unavailable: teacher absences
        existing_timetable: assignments to preserve when possible
    """

    subjects = data.get("subjects", [])
    teachers = data.get("teachers", [])
    rooms = data.get("rooms", [])
    groups = data.get("student_groups", [])
    days = data.get("days", [])
    slots = data.get("slots", [])
    unavailable = data.get("unavailable", [])
    existing = data.get("existing_timetable", [])

    if not all([subjects, teachers, rooms, groups, days, slots]):
        return {
            "success": False,
            "message": (
                "Subjects, teachers, rooms, student groups, "
                "days, and slots are required."
            )
        }

    # Validate identifiers and scheduling inputs.
    teacher_ids = {
        t["id"] for t in teachers if isinstance(t, dict) and "id" in t
    }
    room_ids = set(rooms)
    group_ids = set(groups)

    if len(teacher_ids) != len(teachers):
        return {
            "success": False,
            "message": "Teacher IDs must be unique and valid."
        }

    if len(room_ids) != len(rooms) or len(group_ids) != len(groups):
        return {
            "success": False,
            "message": "Room and student-group IDs must be unique."
        }

    if (
        len(set(days)) != len(days)
        or len(set(slots)) != len(slots)
        or not days
        or not slots
    ):
        return {
            "success": False,
            "message": "Days and time slots must be unique and non-empty."
        }

    # Expand every required lecture into an individual session.
    lectures = []

    for subject in subjects:
        if (
            not isinstance(subject, dict)
            or not isinstance(subject.get("name"), str)
            or not subject["name"].strip()
            or subject.get("teacher") not in teacher_ids
            or subject.get("group") not in group_ids
            or type(subject.get("lectures")) is not int
            or subject["lectures"] < 1
        ):
            return {
                "success": False,
                "message": f"Invalid subject definition: {subject}"
            }

        difficulty = subject.get("difficulty", 3)

        if (
            type(difficulty) is not int
            or not 1 <= difficulty <= 5
        ):
            return {
                "success": False,
                "message": "Difficulty must be an integer from 1 to 5."
            }

        for number in range(subject["lectures"]):
            lectures.append({
                "subject": subject["name"].strip(),
                "teacher": subject["teacher"],
                "group": subject["group"],
                "difficulty": difficulty,
                "lecture_number": number + 1
            })

    # Validate absence records.
    unavailable_set = set()

    for item in unavailable:
        if (
            not isinstance(item, dict)
            or item.get("teacher") not in teacher_ids
            or item.get("day") not in days
            or item.get("slot") not in slots
        ):
            return {
                "success": False,
                "message": f"Invalid teacher unavailability: {item}"
            }

        unavailable_set.add(
            (item["teacher"], item["day"], item["slot"])
        )

    # Optional teacher availability preferences:
    # teachers can specify available_days and available_slots.
    teacher_lookup = {t["id"]: t for t in teachers}

    model = cp_model.CpModel()
    x = {}

    # x[i, d, s, r] = 1 when lecture i uses day d,
    # slot s, and room r.
    for i, lecture in enumerate(lectures):
        teacher = teacher_lookup[lecture["teacher"]]

        for d, day in enumerate(days):
            for s, slot in enumerate(slots):
                unavailable_now = (
                    lecture["teacher"], day, slot
                ) in unavailable_set

                allowed_days = teacher.get("available_days")
                allowed_slots = teacher.get("available_slots")

                if unavailable_now:
                    continue

                if allowed_days is not None and day not in allowed_days:
                    continue

                if allowed_slots is not None and slot not in allowed_slots:
                    continue

                for r, room in enumerate(rooms):
                    x[i, d, s, r] = model.NewBoolVar(
                        f"x_{i}_{d}_{s}_{r}"
                    )

    # Every lecture must be scheduled exactly once.
    for i in range(len(lectures)):
        variables = [
            var for (ii, _, _, _), var in x.items() if ii == i
        ]

        if not variables:
            return {
                "success": False,
                "message": (
                    f"No available time slot for "
                    f"{lectures[i]['subject']}."
                )
            }

        model.AddExactlyOne(variables)

    # A teacher cannot teach two lectures at the same time.
    # A room cannot host two lectures at the same time.
    # A student group cannot attend two lectures at the same time.
    for d, day in enumerate(days):
        for s, slot in enumerate(slots):

            for teacher_id in teacher_ids:
                variables = [
                    var
                    for (i, dd, ss, _), var in x.items()
                    if dd == d
                    and ss == s
                    and lectures[i]["teacher"] == teacher_id
                ]

                if variables:
                    model.AddAtMostOne(variables)

            for r in range(len(rooms)):
                variables = [
                    var
                    for (i, dd, ss, rr), var in x.items()
                    if dd == d and ss == s and rr == r
                ]

                if variables:
                    model.AddAtMostOne(variables)

            for group_id in group_ids:
                variables = [
                    var
                    for (i, dd, ss, _), var in x.items()
                    if dd == d
                    and ss == s
                    and lectures[i]["group"] == group_id
                ]

                if variables:
                    model.AddAtMostOne(variables)

    # Do not schedule two sessions of the same subject
    # for the same group at the same time.
    subject_names = {lecture["subject"] for lecture in lectures}

    for subject_name in subject_names:
        for group_id in group_ids:
            for d in range(len(days)):
                for s in range(len(slots)):
                    variables = [
                        var
                        for (i, dd, ss, _), var in x.items()
                        if dd == d
                        and ss == s
                        and lectures[i]["subject"] == subject_name
                        and lectures[i]["group"] == group_id
                    ]

                    if variables:
                        model.AddAtMostOne(variables)

    # --------------------------------------------------
    # SOFT CONSTRAINTS / PREFERENCES
    # --------------------------------------------------

    penalties = []

    # 1. Prefer higher-focus periods for difficult subjects.
    # Focus scores range from 1 (low) to 5 (high).
    # If no scores are supplied, assume all slots have
    # the same focus score.
    focus_scores = data.get(
        "focus_scores",
        {slot: 3 for slot in slots}
    )

    for (i, d, s, r), var in x.items():
        difficulty = lectures[i]["difficulty"]
        focus = focus_scores.get(slots[s], 3)

        if not isinstance(focus, int) or not 1 <= focus <= 5:
            return {
                "success": False,
                "message": "Focus scores must be integers from 1 to 5."
            }

        # Higher penalty for difficult subjects in low-focus periods.
        penalty = difficulty * (5 - focus)

        if penalty:
            penalties.append(penalty * var)

    # 2. Preserve existing assignments where possible.
    # These are soft preferences: invalid old assignments
    # are not forced into the new timetable.
    for item in existing:
        for i, lecture in enumerate(lectures):
            if lecture["subject"] != item.get("subject"):
                continue

            if lecture["teacher"] != item.get("teacher"):
                continue

            for d, day in enumerate(days):
                for s, slot in enumerate(slots):
                    for r, room in enumerate(rooms):
                        var = x.get((i, d, s, r))

                        if var is None:
                            continue

                        matches = (
                            day == item.get("day")
                            and slot == item.get("time")
                            and room == item.get("room")
                        )

                        if matches:
                            # No penalty for preserving this assignment.
                            continue

                        # Penalize moving this lecture from its old slot.
                        # The old slot remains preferred if it is still valid.
                        penalties.append(20 * var)

    if penalties:
        model.Minimize(sum(penalties))

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 10

    status = solver.Solve(model)

    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        return {
            "success": False,
            "message": (
                "No valid timetable was found. "
                "Check teacher availability, room capacity, "
                "and the number of available slots."
            )
        }

    timetable = []

    for (i, d, s, r), var in x.items():
        if solver.Value(var):
            lecture = lectures[i]

            timetable.append({
                "subject": lecture["subject"],
                "teacher": lecture["teacher"],
                "student_group": lecture["group"],
                "difficulty": lecture["difficulty"],
                "day": days[d],
                "time": slots[s],
                "room": rooms[r]
            })

    timetable.sort(
        key=lambda item: (
            days.index(item["day"]),
            slots.index(item["time"])
        )
    )

    return {
        "success": True,
        "message": "Timetable optimized successfully.",
        "status": solver.StatusName(status),
        "objective_value": solver.ObjectiveValue(),
        "timetable": timetable
    }