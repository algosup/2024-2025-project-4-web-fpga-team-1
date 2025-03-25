# Technical Specifications Document

---

## 1. Document Revision History

| Version | Date       | Author              | Change Summary                                          |
|---------|------------|---------------------|---------------------------------------------------------|
| 0.1     | 2025-02-26 | Yann-Maël Bouton    | Initial draft                                           |
| 0.2     | 2025-03-04 | Yann-Maël Bouton    | Continued progress and additional details               |
| 0.3     | 2025-03-11 | Yann-Maël Bouton    | Complete technical documentation                        |
| 0.4     | 2025-03-11 | Yann-Maël Bouton    | Added documentation/code guidelines and folder flow       |
| 0.5     | 2025-03-24 | Yann-Maël Bouton    | Reworked & Polished document from part 7       |

---

## 2. Table of Contents

- [1. Document Revision History](#1-document-revision-history)
- [2. Table of Contents](#2-table-of-contents)
- [3. Introduction](#3-introduction)
  - [3.1 Purpose](#31-purpose)
  - [3.2 Scope](#32-scope)
    - [3.2.1 In-Scope](#321-in-scope)
    - [3.2.2 Out-of-Scope](#322-out-of-scope)
  - [3.3 Call for Tender Overview](#33-call-for-tender-overview)
    - [3.3.1 Background](#331-background)
    - [3.3.2 Current Challenges](#332-current-challenges)
    - [3.3.3 Use Cases](#333-use-cases)
- [4. Glossary](#4-glossary)
- [5. Project Overview](#5-project-overview)
  - [5.1 Background](#51-background)
  - [5.2 Goals and Deliverables](#52-goals-and-deliverables)
  - [5.3 Project Scenario](#53-project-scenario)
- [6. System Requirements](#6-system-requirements)
- [7. Technical Architecture](#7-technical-architecture)
  - [7.1 Technology Stack](#71-technology-stack)
  - [7.2 System Components and Interactions](#72-system-components-and-interactions)
  - [7.3 Code Conversion & Animation Flow](#73-code-conversion--animation-flow)
  - [7.4 API Endpoints and Process Flow](#74-api-endpoints-and-process-flow)
  - [7.5 Creating a Custom Parser](#75-creating-a-custom-parser)
- [8. User Interface Specifications](#8-user-interface-specifications)
- [9. Deliverables](#9-deliverables)
- [10. Appendices](#10-appendices)
  - [10.1 Typography & CSS Guidelines](#101-typography--css-guidelines)
  - [10.2 Documentation Guidelines](#102-documentation-guidelines)
  - [10.3 Code Style Guidelines](#103-code-style-guidelines)
  - [10.4 Project Folder Flow](#104-project-folder-flow)


---

## 3. Introduction

### 3.1 Purpose

This document gives the technical specs. For an FPGA Simulator. Its purpose is to be used as a guideline for developers, project managers, and stakeholders to understand the scope, architecture, and requirements of the system.

### 3.2 Scope

#### 3.2.1 In-Scope

- Convert .v & .sdf files dynamically in a readable format for the graphic processor.
- Development of the graphical representation of the FPGA workflow.
- Display basic FPGA elements (like BEL's) with their interconnections.
- Use a timing simulator to visualize the propagation of clock signal between all wires and elements. 
- Include some controls to rollback, pause, advance the simulation.

#### 3.2.2 Out-of-Scope

- Development of FPGA synthesis or P&R tools. 
- Custom FPGA hardware development.
- Building a fully integrated development environment (IDE) for FPGA design.

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

- **FPGA**: It is an integrated circuit with basic elements and preconfigured electrical signal routes between them. The selected FPGA is a NanoXplore NGultra (with VTR flow a basic Xilinx series 7 model will be used )
- **Basic Element (BEL)**: These are the hardware electrical ressources available inside the FPGA like fliflop, Look-Up-Table (LUT), Block RAM....
- **Application**: In this context it will be the function to be executed in the FPGA (developed in verilog).
- Synthesis: translation of the application into an electrical equivalent. It creates a netlist (which can be exported as a netlist). The tool used will be Impulse (or Yosys in VTR flow )
- **P&R**: Place and Route is the packing of the netlist component in the FPGA available BEL (Place). Then a route for signals between each BEL is selected (Route). The tool used will be Impulse . A timing netlist is created and can be exported in verilog. The tool used will be Impulse (or VPR for place and route in vtr flow )
- **Simulator**: It compiles Verilog testbenches and applications and executes the simulation of every signal with regard to time evolution. The tool used will be Modelsim (using Icarus verilog was not achieved yet for VTR flow)
- **Sofware**: It is the developped web application int he frame of this call for tender.

---

## 5. Project Overview

### 5.1 Background

Designers need an intuitive look for both FPGA’s physical structure and how signals propagate over time. This project blends the netlist layout with real-time simulation data to offer a hands-on tool that brings the inner workings of FPGAs to life.

### 5.2 Goals and Deliverables

- **File Conversion Utility:** Create a reliable and efficient parser capable of transforming `.v` and `.sdf` files into a uniform JSON pivot format.
- **Interactive Visual Simulation:** Design a user-friendly front-end interface to visualize FPGA layouts clearly and simulate the propagation of signals according to timing data.
- **Persistent Data Storage:** Utilize MongoDB for effectively storing simulation states and FPGA structure representations, enabling easy replayability and deeper analysis.
- **Simulation Controls:** Integrate user-friendly playback features, including intuitive controls for play, pause, step-through simulation, and adjustable simulation speeds (e.g., x1, x2, x4).

### 5.3 Project Scenario

- **Teacher Use Case:** Teachers can effortlessly upload and organize Verilog files along with associated test benches, subsequently generating relevant simulation results and data sets.
- **Student Use Case:** Students gain access to a curated selection of application examples, visualize FPGA layouts in a clear 2D format, and interact with the simulation through intuitive controls, enhancing their learning experience.

---

## 6. System Requirements


| Category                   | Requirement Details                                                                                             |
|----------------------------|-----------------------------------------------------------------------------------------------------------------|
| **Functional Requirements**| **Web Application Interface:**<br>- Built using HTML, CSS, and JavaScript.<br>- Dynamic templating with Handlebars.<br><br>**File Upload and Conversion:**<br>- Teachers can upload `.v` (Verilog) and `.sdf` files.<br>- Backend converts uploaded files to JSON pivot format.<br><br>**Graphical Rendering:**<br>- 2D visualization of FPGA layouts including BELs and their connections.<br>- Interactive zooming and panning.<br><br>**Simulation Playback:**<br>- Features: play, pause/resume, step-by-step navigation, and adjustable playback speed.<br><br>**Database Integration:**<br>- MongoDB used for storing simulation pivots, user settings, and simulation history.<br><br>**Security and Authentication:**<br>- Role-based user access control distinguishing teacher and student privileges.|
| **Non-functional Requirements**| **Performance:**<br>- Smooth graphical rendering with real-time simulation updates.<br><br>**Usability:**<br>- Intuitive, responsive interface optimized for multiple device types.<br><br>**Scalability:**<br>- Modular architecture to easily add future enhancements and scale performance.<br><br>**Maintainability:**<br>- Code well-documented following standard coding practices for easy maintenance.<br><br>**Security:**<br>- Secure management of file uploads and data storage, implementing encryption where required.|

---

## 7. Technical Architecture

The technical solution is based on a modular client-server architecture that uses Handlebars as the templating engine for dynamic content rendering and Node.js (Express) as the application server. Without depending on Linux-only utilities, the system is made to work on Windows laptops, ensuring that all conversion technologies and auxiliary tools are fully compatible with the available operating system.

### 7.1 Technology Stack

The backend is designed to handle HTTP requests, file uploads, and conversion operations with Node.js and Express.  Handlebars is used for dynamic web page templating, which ensures that instructor and student interfaces are displayed quickly.  The JavaScript-based conversion modules for.v and.sdf files use proprietary or open-source parsers.  MongoDB manages data durability and operates on Windows without any additional overhead.  The client side uses HTML, CSS, and vanilla JavaScript to provide interactive simulation controls such as play, pause, and step-through.

### 7.2 System Components and Interactions

The solution is divided into numerous interrelated components. A flexible online interface creates an interactive environment for professors and students to submit files, perform simulations, and view FPGA layouts. This interface interfaces with the backend using RESTful APIs provided by the Node.js (Express) server.

- **Web Browser (Front End):** users may upload files, interact with FPGA visuals, and control simulation playback.
- **Express Server (Back End):** accepts file uploads, calls the conversion modules, orchestrates read/write operations to MongoDB, and returns the pivot JSON to the front end.
- **Conversion Modules:** specialized parsers for Verilog (.v) netlists and Standard Delay Format (.sdf) timing data that combine the results into a single pivot JSON structure.
- **MongoDB Database:** Saves user data, pivot JSON files, and simulation metadata for subsequent retrieval.

A simplified schema of the system architecture is illustrated below:

 <img src='img\System Architecture.png' alt='System Architecture' >

### 7.3 Code Conversion & Animation Flow

The application's primary job is to precisely convert source files into a format that allows for simulation animations to be played in real time.  The conversion process begins with two files: a synthesized Verilog file and its associated SDF file.  The Verilog parser extracts the netlist, which contains components (such as fundamental logic parts) and their interconnections.  The SDF parser reads time data, which includes delays and signal transitions.  Both parsers are written in JavaScript to ensure compatibility with all type of OS.

Once processed, the data is combined into a single pivot JSON structure that includes both the static FPGA architecture and the timing connections.  The JSON contains:

- **Components:** Each BEL (e.g., LUT, flip-flop) has an ID, position, and connection endpoints.
- **Timing:** A list of source-destination pairings with corresponding delay values and signal metadata.

On the front end, a specific simulation engine analyzes these temporal parameters to simulate signal propagation. Users can control the simulation flow (start, pause, step, etc.), and the system changes the user interface to highlight signal transitions in real time.

### 7.4 API Endpoints and Process Flow

This section describes the application's whole request processing path, with a focus on API endpoints, user-facing operations, and backend interactions.

1. **File Upload Endpoint**
   `POST /upload`
   Teachers upload two files: synthesized Verilog (.v) and SDF (.sdf). The request often contains multipart form data. The server:

   - Validates file types and sizes.
   - Temporarily stores files in memory or on a disk.
   - Transfers the file paths to the conversion module.

2. **Conversion Module**
   Internally, the Express server activates the JavaScript-based parsers:

   - **verilogParser**: reads the .v file and extracts logic elements, netlists, and hierarchical structure.
   - **sdfParser**: Reads timing data from the .sdf file and assigns delays to netlist connections.
   - **mergeResults**: Combines the Verilog parser's netlist with the SDF parser's timing information to form a single pivot JSON object.

3. **Database Insertion**
   `POST /api/pivot` (internal or combined with upload)
   Once the pivot JSON is generated, the server saves it to MongoDB. The database schema may include:

   - A unique identification (such as an ObjectId or a custom name) for the pivot.
   - The pivot JSON file.
   - Metadata includes the upload date, teacher ID, and additional descriptions.

4. **Retrieve Simulation Data**
   `GET /api/pivot/:id`
   This API obtains the pivot JSON from the database using the unique identifier. The data is sent to the front end, where the user can load previous simulations for playback.

5. **Simulation Playback**
   `GET /simulate/:pivotId`
   Students or teachers request the pivot JSON by providing the pivot ID. The server retrieves the JSON, and the front end uses it to render the FPGA layout and timing animations. Additional parameters (e.g., speed factor, time range) may be passed as query parameters to tailor the simulation experience.

6. **Front-End Interaction**
   After receiving the pivot JSON, the front-end JavaScript code:

   - Renders a 2D or schematic view of the FPGA layout.
   - Interprets the timing data to animate signals.
   - Provides controls for stepping forward or backward in the simulation timeline.
   - Optionally stores user preferences (zoom level, playback speed) in local storage or by calling additional endpoints.

7. **Error Handling and Logging**
   All endpoints feature structured error handling, returning HTTP status codes (e.g., 400 for bad requests, 500 for internal server errors) alongside descriptive messages. Logging is implemented through a dedicated logging library or the built-in console, capturing both server-side activities and user actions.

Below is a high-level sequence diagram showing how a teacher might upload files and a student might run the simulation:

 <img src='img\Flow Diagram.png' alt='Flow Diagram' >

## 7.5 Creating a Custom Parser

When developing a custom parser for Verilog and SDF files, our major goal is to scan raw textual material and create an internal data structure that appropriately reflects the netlist components, connections, and timing information. The following strategy is a high-level technique for developing such a parser in JavaScript.

1. **Reading the Input**
   Begin by converting the contents of the.v or.sdf file to a string. If the file is lengthy, you might read it line by line or buffer portions of it.

2. **Lexical Analysis (Tokenization)**
   A parser usually begins by transforming a raw string into tokens, which are meaningful symbols like keywords, identifiers, numbers, or punctuation. We can use a basic regular expression-based scanner or a state machine technique.

   - **Regex Approach:** Use numerous regex patterns consecutively to detect tokens such as module names, port definitions, timing parameters, and so on.
   - **State Machine Approach:** Iterate through the file, character by character, creating tokens based on identified character sequences and transitions.

   **Syntactic Parser**
   After tokens are formed, the parser traverses the token stream to interpret higher-level structures. For Verilog, we can check for module definitions, port lists, wire declarations, and instantiation statements. For SDF, we would parse temporal constructs like delays for certain pathways. You can use a recursive descent parser, a parser generator, or any approach who work. The goal is to create an Abstract Syntax Tree (AST), a structured representation of the relationships.

3. **Error Handling**
   During parsing, add checks for:

   - Unclosed parentheses, missing semicolons, or unmatched begin/end statements.
   - Incorrect syntax for timing specs in the SDF.
   - Reserved keywords used as identifiers.
     Provide clear error messages and line numbers to assist in debugging.

4. **Building an Intermediate Representation**
   After validating the syntax, we can store the parsed data in an intermediate object, for example:

   ```js
   const verilogData = {
     modules: [
       {
         name: 'top_module',
         ports: [...],
         wires: [...],
         instances: [...]
       },
       // more modules
     ]
   };

   const sdfData = {
     cells: [
       {
         cellType: 'LUT',
         cellName: 'inst1',
         delay: 3.5,
         // additional fields
       },
       // more cells
     ]
   };
   ```

   This intermediate representation can reflect all essential details, such as instance names, parameter values, and hierarchical definitions.

5. **Merging Data**\
   Once we have different representations for.v and.sdf, we'll write a function to combine them into the pivot JSON structure. This merge stage typically compares netlist components in the Verilog data to the equivalent timing entries in the SDF data, using instance names or hierarchical paths for search.

   ```js
   function mergeData(verilogData, sdfData) {
     // 1. Create a map of cellName -> delay or timing info from sdfData
     // 2. For each instance in verilogData, attach the relevant timing data
     // 3. Construct the final pivot JSON, including components and timing arrays
   }
   ```

6. **Pivot JSON Output**\
   The final pivot JSON will have two core sections:

   - **Components:** An array of objects, each of which represents an FPGA primitive or BEL and stores its name, type, hierarchical path, and port connectivity.
   - **Timing:** A structure that captures delays and other performance factors by correlating each source-destination pair with the appropriate time information.

7. **Testing and Validation**\
   Thorough testing is necessary:

   - **Unit tests** ensure that each parser function (tokenization, syntax tree building, and merging) works for valid files while gracefully failing for invalid ones.
   - **Integration Tests:** Ensure that uploading real-world .v and .sdf data results in an accurate pivot JSON in the end step.

---

## 8. User Interface Specifications

The user interface is intended to provide separate experiences for teachers and students.  For instructors, the interface provides an easy-to-use file upload site that walks them through the process of submitting .v and .sdf files.  Following a successful upload, the conversion process is launched automatically, and teachers receive quick feedback on the conversion's status and database storage.

Students have access to a simulation environment that shows a clear 2D representation of the FPGA layout.  The interface includes controls for zooming, panning, and interacting with individual FPGA pieces.  Additionally, simulation controls are prominently presented to allow for play, pause, step-through, and speed modifications.  The layout is responsive, ensuring constant performance across a variety of devices and screen sizes.  A typical user flow for simulation interaction begins with picking a preloaded simulation from the database, and then the animation flow is generated using the pivot JSON data given from the backend.

---

## 9. Deliverables

The final deliverable is a fully working online application that translates synthesized Verilog and SDF files into pivot JSON format, which is then utilized to power an interactive FPGA simulation animation.  The delivery comprises the whole Node.js application, source code for the conversion modules, a responsive front-end interface created using Handlebars templates, and a MongoDB database schema for permanent storage.  The accompanying documentation includes installation, configuration, testing processes, and usage directions for both the teacher and student interfaces.

---

## 10. Appendices

### 10.1 Typography & CSS Guidelines

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

### 10.2 Documentation Guidelines

- **Document Naming Convention:**  
  - Use a standard format such as `DocumentName_Version_Date.ext` (e.g., `Technical_Specifications_0.4_2025-03-11.docx`).
  - Titles should be explicit and reflect the content (e.g., "User Manual", "API Documentation").
- **Writing Style:**  
  - Use clear, concise, and professional language.
  - Maintain consistent numbering for sections and subsections.
  - Incorporate diagrams and tables to clarify information.

---

### 10.3 Code Style Guidelines

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

### 10.4 Project Folder Flow

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

---