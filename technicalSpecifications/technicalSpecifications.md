# Technical Specifications Document

## 1. Document Revision History

| Version | Date       | Author        | Change Summary          |
|---------|------------|---------------|-------------------------|
| 0.1     | 2025-02-26 | Yann-Maël Bouton   | Initial draft      |
| 0.1     | 2025-03-04 | Yann-Maël Bouton   | Continue progressing|

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
  - [6.1 Functional Requirements](#61-functional-requirements)
  - [6.2 Non-functional Requirements](#62-non-functional-requirements)
- [7. Technical Architecture](#7-technical-architecture)
- [8. User Interface Specifications](#8-user-interface-specifications)
  - [8.1 Student Interface](#81-student-interface)
  - [8.2 Teacher Interface](#82-teacher-interface)
- [9. Data and File Formats](#9-data-and-file-formats)
- [10. Integration and Testing](#10-integration-and-testing)
- [11. Deployment and Maintenance](#11-deployment-and-maintenance)
- [12. Deliverables](#12-deliverables)
- [13. References and Related Work](#13-references-and-related-work)
- [14. Appendices](#14-appendices)

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

- **Background**:  
  Designers using FPGAs need to visualize both the physical layout (2D floorplan) and the timing of signal propagation to validate their applications. This project aims to merge these two views.

- **Objectives**: 
- Create a convertion tool that can translate .v & .sdf file into readable .json object. 
- Visualisate timing data in the context of a code layout.
- Save FPGA representation for future use (save into database).
- Enable interactive control (play, pause, step, variable speed).

- **Project Context**:  
- **Teacher Use Case**: Provide backend tools for uploading Verilog applications and testbenches, and generating the necessary simulation data.
- **Student Use Case**: Allow students to select preloaded application examples and interact with the simulation.

---

## 6. System Requirements

### 6.1 Functional Requirements

- **Programming Language & Platform**
  - The software must be accessible through a web interface.
  - The technology stack is open to selection; justify your choice.

- **User Roles**
  - **Teacher (Backend)**
    - Upload Verilog applications and associated testbenches.
    - Generate necessary simulation data (pivot file format).
  - **Student (Frontend)**
    - Select preloaded application examples.
    - Interact with a 2D FPGA floorplan visualization.

- **Student Web Interface Features**
  - Display a 2D view of the FPGA layout (BELs and signal routes).
  - Support navigation controls (zoom, pan).
  - Control simulation playback (play, pause/resume, step).
  - Adjust simulation speed (e.g., x1, x2, x4, etc.).

- **Teacher Backend Features**
  - Interface to upload and manage Verilog application files and testbenches.
  - Generate and validate the intermediary pivot file format for simulation data.
  - Manage multiple application examples.

### 6.2 Non-functional Requirements

- **Performance**:  
  - Fast rendering of FPGA layouts and smooth simulation playback.
  - Real-time or near-real-time updates on signal propagation.

- **Usability**:  
  - Intuitive and user-friendly interfaces for both teacher and student roles.
  - Responsive design for different devices and screen sizes.

- **Scalability & Maintainability**:  
  - The architecture should allow easy updates and integration of new features.
  - Code and documentation must follow best practices to ensure maintainability.

- **Security**:  
  - Secure authentication and role-based access controls.
  - Protection of uploaded files and simulation data.

---