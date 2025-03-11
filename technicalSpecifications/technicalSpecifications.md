# Technical Specifications Document

---

## 1. Document Revision History

| Version | Date       | Author              | Change Summary                                          |
|---------|------------|---------------------|---------------------------------------------------------|
| 0.1     | 2025-02-26 | Yann-Maël Bouton    | Initial draft                                           |
| 0.2     | 2025-03-04 | Yann-Maël Bouton    | Continued progress and additional details               |
| 0.3     | 2025-03-11 | Yann-Maël Bouton    | Complete technical documentation                        |
| 0.4     | 2025-03-11 | Yann-Maël Bouton    | Added documentation/code guidelines and folder flow       |

---

## 2. Table of Contents

- [1. Document Revision History](#1-document-revision-history)
- [2. Table of Contents](#2-table-of-contents)
- [3. Introduction](#3-introduction)
  - [3.1 Purpose](#31-purpose)
  - [3.2 Scope](#32-scope)
  - [3.3 Call for Tender Overview](#33-call-for-tender-overview)
- [4. Glossary](#4-glossary)
- [5. Project Overview](#5-project-overview)
- [6. System Requirements](#6-system-requirements)
- [7. Technical Architecture](#7-technical-architecture)
  - [7.1 Technology Stack](#71-technology-stack)
  - [7.2 System Components and Interactions](#72-system-components-and-interactions)
  - [7.3 Code Conversion & Animation Flow](#73-code-conversion--animation-flow)
- [8. User Interface Specifications](#8-user-interface-specifications)
  - [8.1 Student Interface](#81-student-interface)
  - [8.2 Teacher Interface](#82-teacher-interface)
- [9. Data and File Formats](#9-data-and-file-formats)
  - [9.1 Verilog and SDF Conversion to Pivot JSON](#91-verilog-and-sdf-conversion-to-pivot-json)
  - [9.2 Pivot to Animation Translation](#92-pivot-to-animation-translation)
- [10. Integration and Testing](#10-integration-and-testing)
- [11. Deployment and Maintenance](#11-deployment-and-maintenance)
- [12. Deliverables](#12-deliverables)
- [13. References and Related Work](#13-references-and-related-work)
- [14. Appendices](#14-appendices)
  - [14.1 Document Charts and Typography Guidelines](#141-document-charts-and-typography-guidelines)
  - [14.2 Documentation and Code Style Guidelines](#142-documentation-and-code-style-guidelines)
  - [14.3 Project Folder Flow](#143-project-folder-flow)

---

## 3. Introduction

### 3.1 Purpose

This document give the technical specs. for an FPGA Simulator. Its purpose is to be use as a guideline for developers, project managers, and stakeholders to understand the scope, architecture, and requirements of the system.

### 3.2 Scope

#### 3.2.1 In-Scope

- Convert .v & .sdf files dynamicly in a readable format for the graphic processor.
- Development of the graphical representation of the FPGA workflow.
- Display basic FPGA elements (like BEL's) with their intereconnections.
- Use a timing simulator to visualize the propagation of clock signal between all wires and elements. 
- Include some controls to rollback, pause, advance the simulation.

#### 3.2.2 Out-of-Scope

- Development of FPGA synthesis or P&R tools. 
- Custom FPGA hardware development.
- Building a full integrated development environment (IDE) for FPGA design.

### 3.3 Call for Tender Overview

#### 3.3.1 Background

Develop a web interface for an FPGA Simulator. This interface will be used to teach how signals propagate inside an FPGA.

#### 3.3.2 Current Challenges

- Merge the 2D FPGA layout (post-synthesis and P&R) with timing simulation data.
- Graphical display requires two inputs: a netlist schematic (Verilog format) and a standard delay file (SDF format).
- Save FPGA representation for future use (save into database).

#### 3.3.3 Use Cases

- **Teacher Use Case:** Load the server with several application examples and associated Verilog testbenches (backend).
- **Student Use Case:** Select preloaded examples, navigate the 2D view of FPGA BELs and routes, and control simulation playback.

---

## 4. Glossary

_This section defines key terms used in this document._

- **FPGA**: it is an integrated circuit with basic elements and preconfigured electrical signal routes between them. The selected FPGA is a NanoXplore NGultra (with VTR flow a basic Xilinx serie 7 model will be used )
- **Basic Element (BEL)**: these are the hardware electrical ressources available inside the FPGA like fliflop, Look-Up-Table (LUT), Block RAM....
- **Application**: in this context it will be the function to be executed in the FPGA (developped in verilog).
- Synthesis: translation of the application into an electrical equivalent. It creates a netlist (which can be exported as a netlist). The tool used will be Impulse (or yosys in vtr flow )
- **P&R**: Place and Route is the packing of the netlist component in the FPGA available BEL (Place). Then a route for signals between each BEL is selected (Route). The tool used will be Impulse . A timing netlist is created and can be exported in verilog. The tool used will be Impulse (or VPR for place and route in vtr flow )
- **Simulator**: It compiles verilog testbenches and application and execute the simulation of every signal with regard to time evolution. The tool used will be Modelsim (using icarus verilog was not achieved yet for VTR flow)
- **Sofware**: It is the developped web application int he frame of this call for tender.

---

## 5. Project Overview

### 5.1 Background

Designers need an intuitive look at both an FPGA’s physical structure and how signals propagate over time. This project blends the netlist layout with real-time simulation data to offer a hands-on tool that brings the inner workings of FPGAs to life.

### 5.2 Goals and Deliverables

- **File Conversion Utility:** Create a reliable and efficient parser capable of transforming `.v` and `.sdf` files into a uniform JSON pivot format.
- **Interactive Visual Simulation:** Design a user-friendly front-end interface to visualize FPGA layouts clearly and simulate the propagation of signals according to timing data.
- **Persistent Data Storage:** Utilize MongoDB for effectively storing simulation states and FPGA structure representations, enabling easy replayability and deeper analysis.
- **Simulation Controls:** Integrate user-friendly playback features, including intuitive controls for play, pause, step-through simulation, and adjustable simulation speeds (e.g., x1, x2, x4).

### 5.3 Project Scenario

- **Teacher Use Case:** Teachers can effortlessly upload and organize Verilog files along with associated testbenches, subsequently generating relevant simulation results and data sets.
- **Student Use Case:** Students gain access to a curated selection of application examples, visualize FPGA layouts in a clear 2D format, and interact with the simulation through intuitive controls, enhancing their learning experience.

---

## 6. System Requirements


| Category                   | Requirement Details                                                                                             |
|----------------------------|-----------------------------------------------------------------------------------------------------------------|
| **Functional Requirements**| **Web Application Interface:**<br>- Built using HTML, CSS, and JavaScript.<br>- Dynamic templating with Handlebars.<br><br>**File Upload and Conversion:**<br>- Teachers can upload `.v` (Verilog) and `.sdf` files.<br>- Backend converts uploaded files to JSON pivot format.<br><br>**Graphical Rendering:**<br>- 2D visualization of FPGA layouts including BELs and their connections.<br>- Interactive zooming and panning.<br><br>**Simulation Playback:**<br>- Features: play, pause/resume, step-by-step navigation, and adjustable playback speed.<br><br>**Database Integration:**<br>- MongoDB used for storing simulation pivots, user settings, and simulation history.<br><br>**Security and Authentication:**<br>- Role-based user access control distinguishing teacher and student privileges.|
| **Non-functional Requirements**| **Performance:**<br>- Smooth graphical rendering with real-time simulation updates.<br><br>**Usability:**<br>- Intuitive, responsive interface optimized for multiple device types.<br><br>**Scalability:**<br>- Modular architecture to easily add future enhancements and scale performance.<br><br>**Maintainability:**<br>- Code well-documented following standard coding practices for easy maintenance.<br><br>**Security:**<br>- Secure management of file uploads and data storage, implementing encryption where required.|

---

## 7. Technical Architecture

### 7.1 Technology Stack

- **Frontend:** HTML5, CSS3, JavaScript, and Handlebars for templating.
- **Backend:** Node.js/Express to handle API endpoints, file uploads, and conversion processing.
- **Database:** MongoDB for storing simulation states, pivot JSON data, and preloaded application examples.
- **Simulation Engine Integration:**  
  - Use Modelsim for running the simulation.
  - A custom conversion module parses the simulation outputs.

### 7.2 System Components and Interactions

The system is divided into the following major modules:

- **File Conversion Module:**  
  - **Input:** Verilog (`.v`) and SDF files.  
  - **Process:** Parses the source files, performs syntactic and timing analysis, and produces a pivot JSON.
  - **Output:** A standardized JSON pivot file for downstream use.

- **Web Interface Module:**  
  - **Teacher Panel:** For file uploads, simulation data management, and administrative actions.
  - **Student Panel:** For interacting with the simulation visualization, controlling playback, and viewing signal propagation.

- **Animation Controller:**  
  - **Input:** JSON pivot file.
  - **Process:** Interprets the pivot data and maps timing information to animated elements on the 2D layout.
  - **Output:** Real-time graphical updates reflecting the simulated signal propagation.

- **Database Module:**  
  - **Storage:** Persist simulation files, pivot data, and user sessions.
  - **Access:** Provide APIs for reading/writing simulation data during runtime.

### 7.3 Code Conversion & Animation Flow

This section describes the process of converting raw simulation code into an intermediate pivot format, and then using that data to animate the FPGA layout:

#### 7.3.1 Verilog/SDF to Pivot Conversion

1. **File Input:**  
   The system ingests Verilog and SDF files uploaded by the teacher.
2. **Parsing Engine:**  
   A parser analyzes the Verilog code for structural (netlist) data and the SDF file for timing delays.
3. **Pivot File Generation:**  
   The parsed data is merged into a JSON object with defined keys (e.g., BEL identifiers, connection mapping, timing events).
4. **Storage:**  
   The generated JSON pivot file is stored in MongoDB for persistence and future retrieval.

> **Flowchart: Conversion Module**
 <img src='img\High-Level Conversion Module Diagram.png' alt='Conversion Module' >


#### 7.3.2 Pivot to Animation Translation

1. **Data Fetching:**  
   When a student selects an example, the frontend fetches the corresponding pivot JSON from the database.
2. **Animation Mapping:**  
   JavaScript code (with Handlebars templating) maps pivot JSON data to visual elements on the FPGA floorplan.
3. **Animation Engine:**  
   A controller module reads timing data from the pivot file and triggers CSS/JS-driven animations to illustrate signal propagation across BELs.
4. **User Interaction:**  
   The system supports interactive controls (play, pause, step, and speed adjustment) that modify the animation timeline.

> **Flowchart: Animation Controller**
 <img src='img\Animation Flow Diagram.png' alt='Animation Controller' >

---

## 8. User Interface Specifications

### 8.1 Student Interface

- **2D FPGA Layout View:**  
  - An interactive grid displaying FPGA BELs and signal routes.
  - Supports zoom and pan with smooth transitions.
- **Simulation Controls:**  
  - Playback buttons (Play, Pause/Resume, Step Forward, Rollback).
  - Speed adjustment options (x1, x2, x4, etc.).
- **Status Indicators:**  
  - Real-time signal propagation indicators.
  - A timeline display showing the progression of simulation events.

### 8.2 Teacher Interface

- **Dashboard:**  
  - File upload area for Verilog and SDF files.
  - List view of uploaded examples with options to generate, preview, and manage pivot files.
- **Configuration Panel:**  
  - Tools to adjust simulation parameters and verify conversion outputs.
  - Logs and error reporting for file parsing.

---

## 9. Data and File Formats

### 9.1 Verilog and SDF Conversion to Pivot JSON

- **Verilog File (`.v`):**  
  Contains the netlist and logic description of the FPGA design.

- **SDF File (`.sdf`):**  
  Provides delay information essential for timing simulation.

- **Conversion Process:**  
  The conversion module parses these files and produces a JSON object with:
  - A list of BELs and their properties.
  - Routing interconnections.
  - Time-stamped signal events.

- **Example JSON Structure:**
  ```json
  {
    "BELs": [
      { "id": "BEL001", "type": "LUT", "connections": ["BEL002", "BEL003"] },
      { "id": "BEL002", "type": "FlipFlop", "connections": ["BEL004"] }
    ],
    "timing": [
      { "time": 10, "signal": "CLK", "origin": "BEL001", "destination": "BEL002" },
      { "time": 20, "signal": "DATA", "origin": "BEL002", "destination": "BEL004" }
    ]
  }
  ```

### 9.2 Pivot to Animation Translation

- **Mapping:**  
  The frontend JavaScript engine reads the pivot file and maps each element to a corresponding graphical component.

- **Animation Flow:**  
  - Based on the "timing" array, CSS and JS animations are triggered to simulate signal flow.
  - User controls interact directly with the animation engine, allowing pausing, stepping, or adjusting playback speed.

- **Implementation Tip:**  
  Leverage `requestAnimationFrame` for smooth animations and manage state with JavaScript objects representing the simulation timeline.

---

## 10. Integration and Testing

- **Module-Level Checks:**
  - Verify functionality of individual components, including file parsing accuracy, correct JSON output, and reliable activation of animations.

- **Integrated Workflow Validation:**
  - Assess complete process flow, from initial file upload to final animation output.
  - Employ realistic test scenarios with Verilog testbenches and SDF files to ensure practical reliability.

- **User Feedback Sessions:**
  - Organize hands-on trials with representative groups of teachers and students to gather insights on usability and user satisfaction.

- **Performance Evaluation:**
  - Monitor system responsiveness and animation fluidity under different workload intensities to confirm real-time performance standards.

---

## 11. Deployment and Maintenance

- **Deployment Environment:**  
  - Node.js server deployed on a cloud platform.
  - MongoDB hosted either locally or via a managed cloud service (e.g., MongoDB Atlas).
- **CI/CD Pipeline:**  
  - Automated builds, tests, and deployments using industry-standard tools.
- **Maintenance:**  
  - Regular updates based on user feedback.
  - Detailed documentation and versioning in source control.

---

## 12. Deliverables

- **Source Code:**  
  - Frontend application (HTML/CSS/JS/Handlebars).
  - Backend API and conversion module (Node.js/Express).
  - Integration with MongoDB.
- **Documentation:**  
  - This technical specifications document.
  - User manuals for both teacher and student interfaces.
- **Test Suites:**  
  - Automated tests for each module.
- **Deployment Scripts:**  
  - Scripts and guidelines for production deployment.

---

## 13. References and Related Work

- **FPGA Documentation:**  
  - NanoXplore NGultra and Xilinx Series 7 specifications.
- **Simulation Tools:**  
  - Modelsim and alternative simulation engines.
- **Web Technologies:**  
  - Documentation on HTML5, CSS3, JavaScript, and Handlebars.
- **Database Integration:**  
  - MongoDB best practices and Mongoose documentation for Node.js.

---

## 14. Appendices

### 14.1 Document Charts and Typography Guidelines

#### 14.1.1 Typography & CSS Guidelines

- **Font Families:**  
  - Use sans-serif fonts for digital readability (e.g., Arial, Helvetica, or Open Sans).
- **Headings and Subheadings:**  
  - H1 for the document title, H2 for main section titles, and H3/H4 for subsections.
- **Tables and Diagrams:**  
  - Styled with CSS for clarity; use alternate row colors for tables and clear borders.
- **Responsive Design:**  
  - Ensure layouts adapt to various screen sizes using CSS media queries.
- **Code Blocks and Flowcharts:**  
  - Displayed in monospace fonts with appropriate background highlighting for improved legibility.

---

### 14.2 Documentation and Code Style Guidelines

#### 14.2.1 Documentation Guidelines

- **Document Naming Convention:**  
  - Use a standard format such as `DocumentName_Version_Date.ext` (e.g., `Technical_Specifications_0.4_2025-03-11.docx`).
  - Titles should be explicit and reflect the content (e.g., "User Manual", "API Documentation").
- **Writing Style:**  
  - Use clear, concise, and professional language.
  - Maintain consistent numbering for sections and subsections.
  - Incorporate diagrams and tables to clarify information.

#### 14.2.2 Code Style Guidelines

- **File Naming:**  
  - Use `camelCase` for JavaScript files and module names (e.g., `fileUploader.js`, `animationController.js`).
  - For CSS files, use descriptive names (e.g., `mainStyles.css`, `responsive.css`).
- **Function and Variable Naming:**  
  - Functions should be named in `camelCase` (e.g., `parseVerilogFile()`, `generatePivotJSON()`).
  - Local variables should use `camelCase` (e.g., `userInput`, `simulationData`).
  - Constants should be in `UPPER_SNAKE_CASE` (e.g., `DEFAULT_SIMULATION_SPEED`).
- **Code Structure:**  
  - Comment code with clear, concise explanations for major functions.
  - Follow consistent indentation and spacing for better readability.
  - Use linters and formatters (like ESLint or Prettier) to enforce consistency.
- **Code Documentation:**  
  - Use JSDoc-style blocks for each function to document parameters, return values, and the function’s purpose.
  - Maintain up-to-date documentation within the repository to assist new developers.

---

### 14.3 Project Folder Flow

#### 14.3.1 General Directory Structure

```
project-root/
├── src/
│   ├── backend/
│   │   ├── controllers/        // API request handling and business logic
│   │   ├── models/             // MongoDB schemas and models
│   │   ├── routes/             // Express API route definitions
│   │   ├── utils/              // Utility modules (parsing, conversion, etc.)
│   │   ├── app.js              // Main entry point for the Node.js application
│   │   └── package.json        // Node.js dependencies and scripts
│   ├── frontend/
│   │   ├── assets/
│   │   │   ├── css/            // Stylesheets (mainStyles.css, responsive.css)
│   │   │   ├── js/             // JavaScript files (animation logic, UI controllers)
│   │   │   └── images/         // Images and icons used in the interface
│   │   ├── templates/          // Handlebars templates for dynamic HTML generation
│   │   ├── index.html          // Main entry point for the web application
│   │   └── package.json        // Frontend dependencies and build scripts (Webpack, etc.)
│   └── database/
│       └── mongo.js            // Scripts for configuring and connecting to MongoDB
└── docs/
    └── Technical_Specifications_0.4_2025-03-11.docx  // Complete technical documentations
```

#### 14.3.2 Directory Descriptions

- **backend/**  
  Contains all server-side code including file conversion logic, REST API endpoints, and MongoDB integration.
- **frontend/**  
  Manages the user interface and simulation logic (2D display, animations, playback controls). Handlebars templates dynamically generate HTML based on JSON data.
- **database/**  
  Contains scripts and modules required for MongoDB connection and configuration.
- **docs/**  
  Archives all technical documentation, user manuals, and deployment guides.

---