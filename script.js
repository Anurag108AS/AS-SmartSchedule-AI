"use strict";

/* =========================================================
   SMARTSCHEDULE AI - JAVASCRIPT
   ========================================================= */


/* =========================================================
   1. MOBILE MENU
   ========================================================= */

const mobileMenuBtn = document.getElementById("mobileMenu");
const mobileNav = document.getElementById("mobileNav");

if (mobileMenuBtn && mobileNav) {

    mobileMenuBtn.addEventListener("click", function () {

        mobileNav.classList.toggle("active");

        const icon = mobileMenuBtn.querySelector("i");

        if (mobileNav.classList.contains("active")) {

            if (icon) {
                icon.className = "fa-solid fa-xmark";
            }

            mobileMenuBtn.setAttribute(
                "aria-label",
                "Close menu"
            );

        } else {

            if (icon) {
                icon.className = "fa-solid fa-bars";
            }

            mobileMenuBtn.setAttribute(
                "aria-label",
                "Open menu"
            );
        }
    });


    // Close mobile menu after clicking a link

    const mobileLinks =
        mobileNav.querySelectorAll("a");

    mobileLinks.forEach(function (link) {

        link.addEventListener("click", function () {

            mobileNav.classList.remove("active");

            const icon =
                mobileMenuBtn.querySelector("i");

            if (icon) {
                icon.className = "fa-solid fa-bars";
            }

        });

    });
}


/* =========================================================
   2. OPEN LOGIN
   ========================================================= */


function openLogin() {
    const loginModal = document.getElementById("loginModal");
    const registerModal = document.getElementById("registerModal");

    if (registerModal) {
        registerModal.classList.remove("show");
    }

    if (loginModal) {
        loginModal.classList.add("show");
    }

    document.body.style.overflow = "hidden";
}




/* =========================================================
   3. OPEN REGISTER
   ========================================================= */


function openRegister() {
    const loginModal = document.getElementById("loginModal");
    const registerModal = document.getElementById("registerModal");

    if (loginModal) {
        loginModal.classList.remove("show");
    }

    if (registerModal) {
        registerModal.classList.add("show");
    }

    document.body.style.overflow = "hidden";
}




/* =========================================================
   4. CLOSE MODAL
   ========================================================= */


function closeModal(modalId) {
    const modal = document.getElementById(modalId);

    if (modal) {
        modal.classList.remove("show");
    }

    const loginModal = document.getElementById("loginModal");
    const registerModal = document.getElementById("registerModal");

    if (
        (!loginModal || !loginModal.classList.contains("show")) &&
        (!registerModal || !registerModal.classList.contains("show"))
    ) {
        document.body.style.overflow = "";
    }
}



/* =========================================================
   5. SWITCH LOGIN → REGISTER
   ========================================================= */

function switchToRegister() {

    closeModal("loginModal");

    setTimeout(function () {
        openRegister();
    }, 150);
}


/* =========================================================
   6. SWITCH REGISTER → LOGIN
   ========================================================= */

function switchToLogin() {

    closeModal("registerModal");

    setTimeout(function () {
        openLogin();
    }, 150);
}


/* =========================================================
   7. CLOSE MODAL BY CLICKING OUTSIDE
   ========================================================= */

window.addEventListener("click", function (event) {

    const loginModal =
        document.getElementById("loginModal");

    const registerModal =
        document.getElementById("registerModal");

    if (event.target === loginModal) {
        closeModal("loginModal");
    }

    if (event.target === registerModal) {
        closeModal("registerModal");
    }

});


/* =========================================================
   8. ESC KEY TO CLOSE MODAL
   ========================================================= */

document.addEventListener("keydown", function (event) {

    if (event.key === "Escape") {

        closeModal("loginModal");
        closeModal("registerModal");

    }

});


/* =========================================================
   9. TOAST MESSAGE
   ========================================================= */

function showToast(message, title = "Success") {

    const toast =
        document.getElementById("toast");

    const toastTitle =
        document.getElementById("toastTitle");

    const toastMessage =
        document.getElementById("toastMessage");


    if (!toast) {
        alert(message);
        return;
    }


    if (toastTitle) {
        toastTitle.textContent = title;
    }

    if (toastMessage) {
        toastMessage.textContent = message;
    }


    toast.classList.add("show");


    // Automatically hide after 3 seconds

    setTimeout(function () {

        toast.classList.remove("show");

    }, 3000);

}


/* =========================================================
   10. HIDE TOAST
   ========================================================= */

function hideToast() {

    const toast =
        document.getElementById("toast");

    if (toast) {
        toast.classList.remove("show");
    }

}


/* =========================================================
   11. START SCHEDULER
   ========================================================= */

function startScheduler() {
    const scheduler = document.getElementById("scheduler");

    if (!scheduler) {
        showToast(
            "The scheduler section could not be found.",
            "Error"
        );
        return;
    }

    scheduler.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    showToast(
        "You can now create your timetable.",
        "Scheduler Ready"
    );

    const subjectInput = document.getElementById("subject");

    if (subjectInput) {
        setTimeout(function () {
            subjectInput.focus();
        }, 500);
    }
}


/* =========================================================
   SMARTSCHEDULE AI - PYTHON BACKEND CONNECTION
   ========================================================= */

const BACKEND_URL = "http://127.0.0.1:5000";


/* =========================================================
   OPTIMIZE EXISTING TIMETABLE
   ========================================================= */

async function startOptimization() {

    // Check whether classes exist
    if (!Array.isArray(classes) || classes.length === 0) {

        showToast(
            "Please add some classes before optimizing the timetable.",
            "No Classes Found"
        );

        return;
    }

    try {

        showToast(
            "Sending your timetable to the Python AI optimizer...",
            "Optimization Started"
        );

        /*
         * STEP 1:
         * Get unique teachers, rooms, and student groups.
         */

        const teachers = [
            ...new Set(
                classes.map(item => item.teacher)
            )
        ];

        const rooms = [
            ...new Set(
                classes.map(item => item.room)
            )
        ];

        const studentGroups = [
            ...new Set(
                classes.map(item => item.section)
            )
        ];


        /*
         * STEP 2:
         * Group classes by subject, teacher, and section.
         *
         * The Python optimizer expects a lecture count
         * for each subject.
         */

        const subjectMap = new Map();

        classes.forEach(function (item) {

            const key = JSON.stringify([
                item.subject,
                item.teacher,
                item.section
            ]);

            if (!subjectMap.has(key)) {

                subjectMap.set(key, {
                    name: item.subject,
                    teacher: item.teacher,
                    group: item.section,
                    lectures: 0,
                    difficulty: 3
                });

            }

            subjectMap.get(key).lectures++;

        });

        const subjects = [
            ...subjectMap.values()
        ];


        /*
         * STEP 3:
         * Prepare the timetable data for Python.
         */

        const timetableData = {

            subjects: subjects,

            teachers: teachers.map(function (teacher) {

                return {
                    id: teacher,
                    name: teacher
                };

            }),

            rooms: rooms,

            student_groups: studentGroups,

            days: scheduleDays,

            slots: scheduleTimes,

            focus_scores: {
                "09:10-10:05": 5,
                "10:10-11:05": 5,
                "11:10-12:05": 4,
                "12:10-13:05": 3,
                "13:05-14:00": 2,
                "14:00-14:55": 3,
                "15:00-15:55": 4,
                "16:00-16:55": 4
            },

            unavailable: [],

            existing_timetable: classes.map(
                function (item) {

                    return {
                        subject: item.subject,
                        teacher: item.teacher,
                        student_group: item.section,
                        day: item.day,
                        time: item.time,
                        room: item.room
                    };

                }
            )

        };


        /*
         * STEP 4:
         * Send the data to the Python Flask backend.
         */

        const response = await fetch(
            `${BACKEND_URL}/api/optimize`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(timetableData)
            }
        );


        /*
         * STEP 5:
         * Read the response from Python.
         */

        const result = await response.json();

        console.log(
            "Python backend response:",
            result
        );


        /*
         * STEP 6:
         * Handle optimization errors.
         */

        if (!response.ok || !result.success) {

            throw new Error(
                result.message ||
                `Optimization failed (HTTP ${response.status}).`
            );

        }


        /*
         * STEP 7:
         * Validate the returned timetable.
         */

        if (
            !Array.isArray(result.timetable) ||
            result.timetable.length === 0
        ) {

            throw new Error(
                "The optimizer did not return any timetable entries."
            );

        }


        /*
         * STEP 8:
         * Convert Python results into the format
         * expected by your existing frontend.
         */

        const optimizedClasses = result.timetable.map(
            function (item, index) {

                return {

                    id: Date.now() + index,

                    subject: item.subject,

                    teacher: item.teacher,

                    room: item.room,

                    section: item.student_group,

                    day: item.day,

                    time: item.time

                };

            }
        );


        /*
         * STEP 9:
         * Update the existing timetable.
         */

        classes = optimizedClasses;

        localStorage.setItem(
            "smartScheduleClasses",
            JSON.stringify(classes)
        );

        renderTimetable();


        /*
         * STEP 10:
         * Notify the user.
         */

        showToast(
            "Your timetable has been optimized successfully!",
            "Optimization Complete"
        );

        console.log(
            "Optimized timetable:",
            classes
        );

    } catch (error) {

        console.error(
            "SmartSchedule AI optimization error:",
            error
        );

        showToast(
            error.message ||
            "Unable to connect to the Python backend.",
            "Optimization Failed"
        );

    }

}


/* =========================================================
   13. SMOOTH SCROLL
   ========================================================= */

function scrollToSection(sectionId) {

    const section =
        document.getElementById(sectionId);

    if (!section) {
        return;
    }


    section.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}


/* =========================================================
   14. SMOOTH SCROLL FOR NAVIGATION
   ========================================================= */

const navLinks =
    document.querySelectorAll('a[href^="#"]');


navLinks.forEach(function (link) {

    link.addEventListener("click", function (event) {

        const targetId =
            this.getAttribute("href");


        if (
            !targetId ||
            targetId === "#"
        ) {
            return;
        }


        const target =
            document.querySelector(targetId);


        if (!target) {
            return;
        }


        event.preventDefault();


        target.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    });

});


/* =========================================================
   15. LOGIN FORM
   ========================================================= */

const loginForm =
    document.getElementById("loginForm");


if (loginForm) {

    loginForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            const email =
                document.getElementById("loginEmail").value
                    .trim()
                    .toLowerCase();

            const password =
                document.getElementById("loginPassword").value;


            if (!email || !password) {

                showToast(
                    "Please enter email and password.",
                    "Missing Information"
                );

                return;
            }


            // Get registered users

            const users =
                JSON.parse(
                    localStorage.getItem(
                        "smartScheduleUsers"
                    )
                ) || [];


            const user =
                users.find(function (user) {

                    return (
                        user.email === email &&
                        user.password === password
                    );

                });


            if (!user) {

                showToast(
                    "Incorrect email or password.",
                    "Login Failed"
                );

                return;
            }


            // Save current user

            localStorage.setItem(
                "smartScheduleCurrentUser",
                JSON.stringify({
                    name: user.name,
                    email: user.email
                })
            );


            showToast(
                "Welcome back, " + user.name + "!",
                "Login Successful"
            );


            loginForm.reset();


            setTimeout(function () {

                closeModal("loginModal");

            }, 1000);

        }
    );

}


/* =========================================================
   16. REGISTER FORM
   ========================================================= */

const registerForm =
    document.getElementById("registerForm");


if (registerForm) {

    registerForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            const name =
                document.getElementById("registerName")
                    .value
                    .trim();

            const email =
                document.getElementById("registerEmail")
                    .value
                    .trim()
                    .toLowerCase();

            const password =
                document.getElementById("registerPassword")
                    .value;


            /* Email validation */

            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


            if (!emailPattern.test(email)) {

                showToast(
                    "Please enter a valid email address.",
                    "Invalid Email"
                );

                return;
            }


            /* Password validation */

            if (password.length < 6) {

                showToast(
                    "Password must contain at least 6 characters.",
                    "Weak Password"
                );

                return;
            }


            /* Get existing users */

            let users =
                JSON.parse(
                    localStorage.getItem(
                        "smartScheduleUsers"
                    )
                ) || [];


            /* Check existing account */

            const existingUser =
                users.find(function (user) {

                    return user.email === email;

                });


            if (existingUser) {

                showToast(
                    "An account with this email already exists.",
                    "Account Exists"
                );

                return;
            }


            /* Create user */

            const newUser = {

                name: name,

                email: email,

                password: password,

                createdAt:
                    new Date().toISOString()

            };


            users.push(newUser);


            /* Save user */

            localStorage.setItem(
                "smartScheduleUsers",
                JSON.stringify(users)
            );


            showToast(
                "Your account has been created successfully.",
                "Registration Successful"
            );


            registerForm.reset();


            setTimeout(function () {

                closeModal("registerModal");

                openLogin();

            }, 1200);

        }
    );

}


/* =========================================================
   17. CONTACT / OTHER FORMS
   ========================================================= */

const forms =
    document.querySelectorAll("form");

forms.forEach(function (form) {

    if (
        form.id === "loginForm" ||
        form.id === "registerForm" ||
        form.id === "scheduleForm"
    ) {
        return;
    }


    form.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();

            showToast(
                "Your information has been submitted successfully.",
                "Success"
            );

            form.reset();

        }
    );

});


/* =========================================================
   18. ACTIVE NAVIGATION
   ========================================================= */

const sections =
    document.querySelectorAll("section[id]");

const desktopLinks =
    document.querySelectorAll(".desktop-nav a");


window.addEventListener("scroll", function () {

    let currentSection = "";


    sections.forEach(function (section) {

        const sectionTop =
            section.offsetTop - 180;

        const sectionBottom =
            sectionTop + section.offsetHeight;


        if (
            window.scrollY >= sectionTop &&
            window.scrollY < sectionBottom
        ) {

            currentSection =
                section.getAttribute("id");

        }

    });


    desktopLinks.forEach(function (link) {

        link.classList.remove("active");


        if (
            link.getAttribute("href") ===
            "#" + currentSection
        ) {

            link.classList.add("active");

        }

    });

});


/* =========================================================
   19. SCROLL REVEAL
   ========================================================= */

const revealElements =
    document.querySelectorAll(
        ".feature-card, .process-card, .optimization-content"
    );


if ("IntersectionObserver" in window) {

    const observer =
        new IntersectionObserver(
            function (entries) {

                entries.forEach(function (entry) {

                    if (entry.isIntersecting) {

                        entry.target.classList.add(
                            "visible"
                        );

                        observer.unobserve(
                            entry.target
                        );

                    }

                });

            },
            {
                threshold: 0.15
            }
        );


    revealElements.forEach(function (element) {

        observer.observe(element);

    });

}


/* =========================================================
   20. INITIALIZE
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "SmartSchedule AI loaded successfully."
        );

    }
);







/* =========================================
   SMART SCHEDULER FUNCTIONALITY
========================================= */

const scheduleForm = document.getElementById("scheduleForm");
const timetableBody = document.getElementById("timetableBody");
const timetableEmpty = document.getElementById("timetableEmpty");
const timetableWrapper = document.getElementById("timetableWrapper");

const scheduleDays = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
];

const scheduleTimes = [
    "09:10-10:05",
    "10:10-11:05",
    "11:10-12:05",
    "12:10-13:05",
    "13:05-14:00",
    "14:00-14:55",
    "15:00-15:55",
    "16:00-16:55"
];

let classes = JSON.parse(localStorage.getItem("smartScheduleClasses")) || [];

/* Check whether a class conflicts with an existing class */
function findScheduleConflict(newClass) {
    return classes.find(function (existingClass) {

        // Classes conflict only when they occur on the same day and time
        if (
            existingClass.day !== newClass.day ||
            existingClass.time !== newClass.time
        ) {
            return false;
        }

        // A teacher cannot teach two classes at the same time
        if (
            existingClass.teacher.toLowerCase() ===
            newClass.teacher.toLowerCase()
        ) {
            return true;
        }

        // Two classes cannot use the same room at the same time
        if (
            existingClass.room.toLowerCase() ===
            newClass.room.toLowerCase()
        ) {
            return true;
        }

        // A section cannot attend two classes at the same time
        if (
            existingClass.section === newClass.section
        ) {
            return true;
        }

        return false;
    });
}

/* Add a new class */
if (scheduleForm) {
    scheduleForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const newClass = {
            id: Date.now(),
            subject: document.getElementById("subject").value.trim(),
            teacher: document.getElementById("teacher").value.trim(),
            room: document.getElementById("room").value.trim(),
            section: document.getElementById("section").value,
            day: document.getElementById("day").value,
            time: document.getElementById("time").value
        };

        // Check for missing fields
        if (
            !newClass.subject ||
            !newClass.teacher ||
            !newClass.room ||
            !newClass.section ||
            !newClass.day ||
            !newClass.time
        ) {
            showToast("Please fill in all class details.", "Missing Information");
            return;
        }

        // Check for timetable conflicts
        const conflictingClass = findScheduleConflict(newClass);

        if (conflictingClass) {
            showToast(
                "Conflict detected! The teacher, room, or section is already scheduled at this time.",
                "Schedule Conflict"
            );
            return;
        }

        // Save the class
        classes.push(newClass);

        localStorage.setItem(
            "smartScheduleClasses",
            JSON.stringify(classes)
        );

        // Update timetable
        renderTimetable();

        scheduleForm.reset();

        showToast("Class added successfully!", "Success");
    });
}

/* Display the timetable */

function renderTimetable() {
    if (!timetableBody || !timetableEmpty || !timetableWrapper) {
        return;
    }

    timetableBody.innerHTML = "";

    if (classes.length === 0) {
        timetableEmpty.style.display = "block";
        timetableWrapper.style.display = "none";
        return;
    }

    timetableEmpty.style.display = "none";
    timetableWrapper.style.display = "block";

    scheduleTimes.forEach(function (time) {
        const row = document.createElement("tr");

        // Time column
        const timeCell = document.createElement("th");
        timeCell.textContent = time.replace("-", " - ");
        row.appendChild(timeCell);

        // Day columns
        scheduleDays.forEach(function (day) {
            const cell = document.createElement("td");

            // Find ALL classes for this day and time
            const matchingClasses = classes.filter(function (item) {
                return item.day === day && item.time === time;
            });

            if (matchingClasses.length > 0) {
                cell.classList.add("has-class");

                matchingClasses.forEach(function (classItem) {
                    // Container for each class
                    const classContainer = document.createElement("div");
                    classContainer.className = "class-card";

                    // Subject
                    const subject = document.createElement("strong");
                    subject.textContent = classItem.subject;
                    classContainer.appendChild(subject);

                    // Teacher
                    const teacher = document.createElement("small");
                    teacher.textContent = "Teacher: " + classItem.teacher;
                    classContainer.appendChild(teacher);

                    // Room
                    const room = document.createElement("small");
                    room.textContent = "Room: " + classItem.room;
                    classContainer.appendChild(room);

                    // Section
                    const section = document.createElement("small");
                    section.textContent = "Section: " + classItem.section;
                    classContainer.appendChild(section);

                    // Delete button
                    const deleteButton = document.createElement("button");
                    deleteButton.textContent = "Delete";
                    deleteButton.type = "button";
                    deleteButton.className = "delete-class-btn";

                    deleteButton.addEventListener("click", function () {
                        deleteClass(classItem.id);
                    });

                    classContainer.appendChild(deleteButton);
                    cell.appendChild(classContainer);
                });
            }

            row.appendChild(cell);
        });

        timetableBody.appendChild(row);
    });
}


/* Load saved classes when the page opens */
renderTimetable();



/* ==========================================
   SMARTSCHEDULE AI - INTERACTION DIAGNOSTICS
   ========================================== */

document.addEventListener("DOMContentLoaded", function () {
    console.log("SmartSchedule AI DOM is ready.");

    // Check important functions
    console.log(
        "startOptimization:",
        typeof startOptimization
    );

    console.log(
        "startScheduler:",
        typeof startScheduler
    );

    console.log(
        "showToast:",
        typeof showToast
    );

    // Check the timetable form
    console.log(
        "scheduleForm:",
        document.getElementById("scheduleForm")
    );

    // Check buttons when clicked
    document.addEventListener("click", function (event) {
        const button = event.target.closest("button");

        if (!button) {
            return;
        }

        console.log("Button clicked:", {
            text: button.innerText.trim(),
            id: button.id,
            className: button.className,
            disabled: button.disabled
        });
    });
});




/* =====================================
   TEST ALL BUTTON CLICKS
===================================== */

document.addEventListener("click", function (event) {
    const button = event.target.closest("button");

    if (button) {
        console.log("Button clicked:", button.innerText.trim());
    }
});




/* DELETE CLASS FUNCTION */
function deleteClass(classId) {
    const confirmed = confirm(
        "Are you sure you want to delete this class?"
    );

    if (!confirmed) {
        return;
    }

    // Remove the selected class
    classes = classes.filter(function (item) {
        return item.id !== classId;
    });

    // Save the updated timetable
    localStorage.setItem(
        "smartScheduleClasses",
        JSON.stringify(classes)
    );

    // Refresh the timetable
    renderTimetable();

    showToast(
        "The class has been deleted successfully.",
        "Class Deleted"
    );
}
