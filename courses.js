// Global variable to store pre-prerequisites
let prePrerequisites = [];
// Store courses by quarter
let coursesByQuarter = {};

function loadDegree(degree) {
  const degreeFile = `./${degree}.json`;
  console.log(degreeFile);

  fetch(degreeFile)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      console.log("Data loaded:", data);
      console.log(data);
      
      
      prePrerequisites = data.prePrerequisites;
      coursesByQuarter = data.quarters;

      // Mostramos los cursos en la página
      displayCourses(data);
      // addCourseOptions();

    })
    .catch((error) => console.error("Error loading JSON:", error));
}
// Function to display the courses on the webpage
function displayCourses(data) {
  // Clear previous courses before displaying new ones
  document.querySelector("#test").innerHTML = "";
  // Check if the "pre-prerequisites" section exists
  if (document.querySelector("#pre-prerequisites")) {
    // Clear previous pre-prerequisites before displaying new ones
    document.querySelector("#pre-prerequisites").innerHTML = "";
    // Create and add a heading for the pre-prerequisites
    const preReqHeader = document.createElement("h2");
    preReqHeader.textContent = "Pre-Prerequisites";
    document.querySelector("#pre-prerequisites").appendChild(preReqHeader);
    // Add a subtitle for the pre-prerequisites
    const subTitle = document.createElement("p");
    subTitle.textContent = "To take the classes below, you must first complete or be enrolled in at least one of the following:";
    document.querySelector("#pre-prerequisites").appendChild(subTitle);
    // Create an unordered list for the pre-prerequisites
    const ul = document.createElement("ul");
    ul.setAttribute("id", "pre-prerequisites");
    document.querySelector("#pre-prerequisites").appendChild(ul);
    // Go through each pre-prerequisite course and add it to the list
    for (let preReq of data.prePrerequisites) {
      const li = document.createElement("li");
      li.classList.add("prereq");
      li.setAttribute("id", preReq.id);
      li.textContent = preReq.name;
      ul.appendChild(li);
    }
  }
  // Go through each quarter in the JSON data
  for (let quarter in data.quarters) {
    // Create and add a header for the quarter
    const quarterNumber = document.createElement("h2");
    quarterNumber.textContent = `Quarter ${quarter.charAt(quarter.length - 1)}`;
    document.querySelector("#test").appendChild(quarterNumber);
    const courses = data.quarters[quarter]; // Get the courses for the current quarter
    const ul = document.createElement("ul"); // Create an unordered list
    ul.setAttribute("id", quarter); // Set the ID of the list
    // Go through each course and add it to the list
    courses.forEach((course) => {
      const li = document.createElement("li");
      li.classList.add("course");
      li.setAttribute("id", course.id);
      // Get the full names of the prerequisites
      let fullPrereqNames = course.prerequisites.map((prereq) => prereq.name).join(", ");
      li.setAttribute("data-prerequisites", fullPrereqNames);
      li.textContent = course.name;
      ul.appendChild(li); // Add the course to the list
    });
    document.querySelector("#test").appendChild(ul); // Add the list to the page
  }
}

// Function to check if prerequisites are met for a course
function checkPrerequisites(courseId) {
  // Find the course by ID
  const course = Object.values(coursesByQuarter).flat().find((c) => c.id === courseId);
  if (!course) return false;
  // Check if all prerequisites are met
  return course.prerequisites.every((prereqObj) => {
    const prereqItem = document.getElementById(prereqObj.id);
    return prereqItem && prereqItem.classList.contains("status-taken");
  });
}
// Function to update the status of a course and its prerequisite courses
function updateCourseStatus(courseId, status) {
  const courseItem = document.getElementById(courseId);
  if (!courseItem) return;
  // Remove any existing status classes
  courseItem.classList.remove(
    "status-taken",
    "status-in-progress",
    "status-eligible",
    "status-not-eligible",
    "status-not-taken"
  );
  if (status === "taken") {
    courseItem.classList.add("status-taken");
    // Update dependent courses to "eligible" if their prerequisites are now met
    const dependentCourses = getDependentCourses(courseId);
    dependentCourses.forEach((dependentCourseId) => {
      const dependentCourseItem = document.getElementById(dependentCourseId);
      if (dependentCourseItem) {
        const prerequisitesMet = checkPrerequisites(dependentCourseId);
        if (prerequisitesMet) {
          dependentCourseItem.classList.remove(
            "status-not-eligible",
            "status-not-taken"
          );
          dependentCourseItem.classList.add("status-eligible");
        }
      }
    });
  } else if (status === "in-progress") {
    courseItem.classList.add("status-in-progress");
  } else if (status === "not-taken") {
    courseItem.classList.add("status-not-taken");
    // Reset all dependent courses that are no longer eligible
    resetCourses(courseId);
  }
}
// Function to reset courses that aren't eligible
function resetCourses(courseId) {
  const dependentCourses = getDependentCourses(courseId);
  dependentCourses.forEach((dependentCourseId) => {
    const dependentCourseItem = document.getElementById(dependentCourseId);
    if (dependentCourseItem) {
      const prerequisitesMet = checkPrerequisites(dependentCourseId);
      // If this course is no longer eligible, reset it
      if (!prerequisitesMet) {
        dependentCourseItem.classList.remove(
          "status-eligible",
          "status-in-progress",
          "status-taken"
        );
        dependentCourseItem.classList.add("status-not-eligible");
        resetCourses(dependentCourseId);
      }
    }
  });
}
// Function to get courses that depend on a given course (prerequisite courses)
function getDependentCourses(courseId) {
  const dependentCourses = [];
  // Loop through all courses in all quarters
  Object.values(coursesByQuarter).flat().forEach((course) => {
    // Check if the current course has courseId as a prerequisite
    if (course.prerequisites.some((prereqObj) => prereqObj.id === courseId)) {
      dependentCourses.push(course.id);
    }
  });
  return dependentCourses;
}
// Function to check if a course is a pre-prerequisites
function isPrePrerequisite(courseId) {
  return prePrerequisites.some((preReq) => preReq.id === courseId);
}
// Function to add course options (the dropdown)
function addCourseOptions() {
  const courseElements = document.querySelectorAll(".course, .prereq");
  courseElements.forEach((courseElement) => {
    const courseId = courseElement.id;
    courseElement.addEventListener("click", () => {
      // Remove any dropdowns on OTHER courses
      document.querySelectorAll(".status-dropdown").forEach((dropdown) => {
        // Remove dropdowns from other elements
        if (!courseElement.contains(dropdown)) {
          dropdown.remove();
        }
      });
      // Check if THIS course already has a dropdown
      const existingDropdown = courseElement.querySelector(".status-dropdown");
      if (existingDropdown) {
        existingDropdown.remove();
        return;
      }
      // Remove any existing dropdowns
      document.querySelectorAll(".status-dropdown").forEach((dropdown) => dropdown.remove());
      // Check if the course should have a dropdown
      const prerequisitesMet = checkPrerequisites(courseId);
      const isPreReq = isPrePrerequisite(courseId);
      // If the course is NOT a prePrerequisite and its prerequisites are NOT met
      if (!isPreReq && !prerequisitesMet) {
        return;
      }
      // Create a new dropdown menu
      const dropdown = document.createElement("div");
      dropdown.className = "status-dropdown";
      // Define the options for the dropdown menu
      const options = [
        { label: "Mark as Taken", value: "taken" },
        { label: "Mark as In Progress", value: "in-progress" },
        { label: "Reset to Not-Taken", value: "not-taken" },
      ];
      // Loop through each option and create a button for it
      options.forEach((option) => {
        const button = document.createElement("button");
        button.textContent = option.label;
        button.addEventListener("click", () => {
          updateCourseStatus(courseId, option.value);
          dropdown.remove();
        });
        dropdown.appendChild(button);
      });
      courseElement.appendChild(dropdown);
    });
  });
}





// Global variables to store data
// let prePrerequisites = [];
// let coursesByQuarter = {};

// // Function to load the JSON file based on the selected program
// // Función para cargar el archivo JSON basado en el programa seleccionado
// function loadDegree(degree) {
//   const degreeFile = `./${degree}.json`;
//   console.log(degreeFile);

//   fetch(degreeFile)
//     .then((response) => {
//       if (!response.ok) {
//         throw new Error(`Error ${response.status}`);
//       }
//       return response.json();
//     })
//     .then((data) => {
//       console.log("Data loaded:", data);
//       console.log(data);
      
      
//       prePrerequisites = data.prePrerequisites;
//       coursesByQuarter = data.quarters;

//       // Mostramos los cursos en la página
//       displayCourses(data);

//     })
//     .catch((error) => console.error("Error loading JSON:", error));
// }

// // Function to display courses on the webpage
// function displayCourses(data) {
//   document.querySelector("#test").innerHTML = "";

//   displayPrePrerequisites(data.prePrerequisites);

//   for (let quarter in data.quarters) {
//     const quarterTitle = document.createElement("h2");
//     quarterTitle.textContent = quarter.replace("quarter", "Quarter ");
//     document.querySelector("#test").appendChild(quarterTitle);

//     const courseList = document.createElement("ul");
//     courseList.setAttribute("id", quarter);

//     data.quarters[quarter].forEach((course) => {
//       console.log(`Curso: ${course.name}, Prerrequisitos:`, course.prerequisites); //verificar 
//       const courseItem = document.createElement("li");
//       courseItem.classList.add("course");
//       courseItem.setAttribute("id", course.id);
//       courseItem.textContent = course.name;

//       if (course.prerequisites.length > 0) {
//         let prereqNames = course.prerequisites.map((prereq) => prereq.name).join(", ");
//         courseItem.setAttribute("data-prerequisites", prereqNames);
//       } else {
//         courseItem.setAttribute("data-prerequisites", "None");
//       }

//       courseList.appendChild(courseItem);
//     });

//     document.querySelector("#test").appendChild(courseList);
//   }

//   addCourseOptions();
//   // attachClickEvents();
// }

// // Function to display pre-requisites
// function displayPrePrerequisites(preReqs) {
//   const preReqSection = document.querySelector("#pre-prerequisites");
//   preReqSection.innerHTML = "";

//   if (preReqs.length === 0) {
//     return; // Don't display section if there are no pre-requisites
//   }

//   const preReqHeader = document.createElement("h2");
//   preReqHeader.textContent = "Pre-Prerequisites";
//   preReqSection.appendChild(preReqHeader);

//   const preReqList = document.createElement("ul");
//   preReqList.setAttribute("id", "pre-prerequisites-list");

//   preReqs.forEach((preReq) => {
//     const li = document.createElement("li");
//     li.classList.add("prereq");
//     li.setAttribute("id", preReq.id);
//     li.textContent = preReq.name;
//     preReqList.appendChild(li);
//   });

//   preReqSection.appendChild(preReqList);
// }

// //Function to check if prerequisites are met
// function checkPrerequisites(courseId) {
//   const course = Object.values(coursesByQuarter).flat().find((c) => c.id === courseId);
//   if (!course) return false;

//   return course.prerequisites.every((prereq) => {
//     const prereqItem = document.getElementById(prereq.id);
//     return prereqItem && prereqItem.classList.contains("status-taken");
//   });
// }



// //Function to update course status
// function updateCourseStatus(courseId, status) {
//   const courseItem = document.getElementById(courseId);
//   if (!courseItem) return;

//   courseItem.classList.remove(
//     "status-taken",
//     "status-in-progress",
//     "status-eligible",
//     "status-not-eligible",
//     "status-not-taken"
//   );

//   if (status === "taken") {
//     courseItem.classList.add("status-taken");

//     // Update dependent courses
//     getDependentCourses(courseId).forEach((dependentCourseId) => {
//       const dependentCourseItem = document.getElementById(dependentCourseId);
//       if (dependentCourseItem) {
//         const prerequisitesMet = checkPrerequisites(dependentCourseId);
//         if (prerequisitesMet) {
//           dependentCourseItem.classList.remove("status-not-eligible", "status-not-taken");
//           dependentCourseItem.classList.add("status-eligible");
//         }
//       }
//     });
//   } else if (status === "in-progress") {
//     courseItem.classList.add("status-in-progress");
//   } else {
//     courseItem.classList.add("status-not-taken");
//     resetCourses(courseId);
//   }
// }



// // Function to reset courses
// function resetCourses(courseId) {
//   getDependentCourses(courseId).forEach((dependentCourseId) => {
//     const dependentCourseItem = document.getElementById(dependentCourseId);
//     if (dependentCourseItem) {
//       const prerequisitesMet = checkPrerequisites(dependentCourseId);
//       if (!prerequisitesMet) {
//         dependentCourseItem.classList.remove("status-eligible", "status-in-progress", "status-taken");
//         dependentCourseItem.classList.add("status-not-eligible");
//         resetCourses(dependentCourseId);
//       }
//     }
//   });
// }

// // Function to get courses that depend on a given course
// function getDependentCourses(courseId) {
//   return Object.values(coursesByQuarter).flat()
//     .filter((course) => course.prerequisites.some((prereq) => prereq.id === courseId))
//     .map((course) => course.id);
// }

// // Function to check if a course is a pre-requisite
// function isPrePrerequisite(courseId) {
//   return prePrerequisites.some((preReq) => preReq.id === courseId);
// }

// //Function to add course dropdown menu for status updates
// function addCourseOptions() {
//   document.querySelectorAll(".course, .prereq").forEach((courseElement) => {
//     console.log("Curso:", courseElement);
//     courseElement.addEventListener("click", () => {
//       document.querySelectorAll(".status-dropdown").forEach((dropdown) => {
//         if (!courseElement.contains(dropdown)) dropdown.remove();
//       });

//       const existingDropdown = courseElement.querySelector(".status-dropdown");
//       if (existingDropdown) {
//         existingDropdown.remove();
//         return;
//       }

//       const dropdown = document.createElement("div");
//       dropdown.className = "status-dropdown";

//       ["taken", "in-progress", "not-taken"].forEach((status) => {
//         const button = document.createElement("button");
//         button.textContent = `Mark as ${status.replace("-", " ")}`;
//         button.addEventListener("click", () => {
//           updateCourseStatus(courseElement.id, status);
//           dropdown.remove();
//         });
//         dropdown.appendChild(button);
//       });

//       courseElement.appendChild(dropdown);
//     });
//   });
// }


