<h1 style='text-align: center'>Project's Name</h1>
<h2 style='text-align: center'> Functional Specification Document</h2>

---

<h3 style='text-align: center'>DOCUMENT VERSION 1.0</h3>
<h3 style='text-align: center'>02/24/2025</h3>


---

<h3>Author & Reviewers</h3>

| Name          | Role            |
| ------------- | --------------- |
| Alexis SANTOS | Program Manager |

<h3>Document History</h3>

| Date       | Version | Document Revision Description                                                   |
| ---------- | :-----: | ------------------------------------------------------------------------------- |
| 02/24/2025 |   1.0   | - Create the document and make the Overview, A to E. <br> - Start the Glossary. |


<h3>Approvals</h3>

| Approval <br> Date | Approved <br> Version | Approver Role | Approver |
| ------------------ | --------------------- | ------------- | -------- |
|                    |                       |               |          |
|                    |                       |               |          |
|                    |                       |               |          |

---

<details> 
<summary>Table of Content</summary>

- [I. Overview](#i-overview)
  - [A. Purpose of the document](#a-purpose-of-the-document)
  - [B. Project Scope](#b-project-scope)
  - [C. Deliverables](#c-deliverables)
  - [D. Project Organisation](#d-project-organisation)
    - [Project Representatives](#project-representatives)
    - [Stakholders](#stakholders)
    - [Project Roles](#project-roles)
  - [E. Project Plan](#e-project-plan)
    - [Milestones](#milestones)
    - [Ressources / Financial Plan](#ressources--financial-plan)
- [II. Requirements](#ii-requirements)
    - [A. Functional Requirements](#a-functional-requirements)
      - [FPGA Simulator](#fpga-simulator)
- [Glossary](#glossary)


</details>

---

# I. Overview

Our client, Florant MANNI ask us to develop a web interface for an FPGA Simulator[^1]. This web interface will be used to teach people how the signals propagate inside an FPGA[^2].

## A. Purpose of the document

The purpose of this Functional Specification is to outline the requirements and design considerations for developing a web interface for an FPGA Simulator[^1]. This interface aims to provide an educational tool that visually demonstrates how signals propagate within an FPGA, enhancing users' understanding of FPGA behavior.

The document will detail the functionalities needed to merge a 2D floorplan representation of an FPGA with the dynamic propagation of signals over time. This includes integrating the layout resulting from synthesis and place-and-route (P&R) processes with timing simulation data. The goal is to create an interactive and intuitive platform that allows users to observe and analyze signal propagation using a testbench and timing netlist[^3], both written in Verilog.

By defining the scope, features, and user interactions, this specification will serve as a comprehensive guide for the development team to ensure the final product meets the educational objectives and technical requirements.

## B. Project Scope 

The project scope for developing the web interface[^4] for the FPGA Simulator includes the following key components and functionalities:

1. 2D floorplan Visualization:

   * Develop a graphical representation of the FPGA layout, displaying the arrangement of basic elements (BELs) and their interconnections.
   * Ensure the layout accurately reflects the post-synthesis and place-and-route (P&R) design.

<br>

2. Signal Propagation Simulation:
   
   * Integrate a timing simulator to visualize the propagation of electrical signals within the FPGA with an animation.
   * Use a testbench and timing netlist[^5], both written in Verilog, to drive the simulation and demonstrate signal behavior over time.

<br>

3. Double Interface:

   * An a web interface used by a student to interact with the program.
   * A backend interface used by a teacher to give a script to the program to train the student with the web interface.

<br>  

4. Interactive User Interface:

   * Create an intuitive web interface that allows users to interact with the FPGA layout and observe signal propagation.
   * Include controls for starting, pausing, and resetting the simulation, as well as options to inspect signal states at specific points in time.

<br>

5. Educational Features:

   * Implement features that enhance learning, such as tooltips, annotations, and step-by-step guides to explain FPGA concepts and signal behavior.
   * Provide options for users to load different FPGA designs and testbenches to explore various scenarios.

<br>

6. Technical Requirements:

    * Ensure the web interface is compatible with modern web browsers and responsive to different screen sizes.
    * Optimize performance to handle complex FPGA designs and real-time signal propagation simulations.
    * Implement security measures to protect user data and ensure the integrity of the simulation environment.

<br>

7. Testing and Validation:

   * Conduct thorough testing to validate the accuracy of the signal propagation simulation and the usability of the interface.
   * Gather feedback from users to iteratively improve the educational value and user experience of the tool.

<br>

By focusing on these components, the project aims to deliver a comprehensive and interactive web interface that effectively teaches users about FPGA signal propagation.

## C. Deliverables

| Name                                | Type                                 | Deadline     | Link                                                       |
| ----------------------------------- | ------------------------------------ | ------------ | ---------------------------------------------------------- |
| Functional Specifications  Document | Document (Markdown)                  | 03/13/2025   | [functionalSpecifications.md](functionalSpecifications.md) |
| Technical Specifications Document   | Document (Markdown)                  | 03/25/2025   | [technicalSpecifications.md]()                             |
| Test Plan Document                  | Document (Markdown)                  | 03/25/2025   | [testPlan.md]()                                            |
| Development                         | Programing (HTML / CSS / JavaScript) | 04/01/2025   |                                                            |
| Weekly Reports                      | Document (Markdown)                  | Every Friday |                                                            |

## D. Project Organisation

### Project Representatives

| Project Owner | Represented by...                              |
| ------------- | ---------------------------------------------- |
| Florant       | Represented by himself                         |
| Loïc NOGUES   | Represented by Alexis SANTOS (Program Manager) |

* Defining the vision and the high-level objectives for the project.
* Approving the requirements, timetable, resources and budjet (if necessary).
* Authorising the provision of funds/resources (internal or external) (if necessary).
* Approving the functional and technical specifications written by the team.
* Ensuring that major business risks are identified and managed by the team.
* Approving any major changes in scope.
* Received Project Weekly Reports and take action accordingly to resolve issues escalated by the Project Manager.
* Ensuring business/operational support arrangements are put in place.
* Ensuring the participation of a business resource (if required).
* Providing final acceptance of the solution upon project completion.

### Stakholders

| Stakeholder      | Might have/find an interest in...                                                            |
| ---------------- | -------------------------------------------------------------------------------------------- |
| Florant          | X                                                                                            |
| ALGOSUP Students | Learning the association with web language (HTML / CSS / JavaScript) with the Verilog (FPGA) |

### Project Roles

As defined at the beginning, the team is arranged in the following manner : 

| Role              | Description  (Can Change)                                                                                                                                             | Name             |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| Project Manager   | *Is in charge of organization, planning and budgeting. <br> Keep the team motivated.*                                                                                 | Loïc NUGUES      |
| Program Manager   | *Makes sure the project meets expectation. <br> Is responsible for writing the Functional Specifications*                                                             | Alexis SANTOS    |
| Technical Leader  | *Makes the technical decision in the project. <br> Translates the Functional Specification into Technical Specifications. <br> Does code review.*                     | Yann-Maël BOUTON |
| Software Engineer | *Writes the code. <br> Participate in the technical design.*                                                                                                          | Lucas MEGNAN     |
| Quality Assurance | *Tests all the functionalities of a product to find bugs and issue. <br> Document bugs and issues. <br> Write the test plan. <br> Check that issues have been fixed.* | Mathis LEBEL     |
| Technical Writter | *Writes documentation. <br> Participate in the technical design.*                                                                                                     | Grégory PAGNOUX  |

## E. Project Plan 

### Milestones



### Ressources / Financial Plan

We have estimated ### man-hours total to complete this project.

* The team (6 people)
* Teachers
* 1 computer per team member
* 1 Linux machine (tested on ubuntu)

# II. Requirements

### A. Functional Requirements

This project is centered on a FPGA Simulator.  

#### FPGA Simulator

The project is based on a FPGA simulator. This one need to follow these requirements: 
* A 2D floorplan of a FPGA board
* The possibility to see the road taken by the electrical signal in the board

However, the client requiested to have two view on this website / webapp.

| Student View / Frontend                                                                       | Teacher View / Backend |
| --------------------------------------------------------------------------------------------- | ---------------------- |
| The 2D view of FPGA Simulator. <br> Navigation into the view with **zoom** and **move**. <br> |                        |


# Glossary

[^1]: An FPGA Simulator is a tool that helps designers test digital circuits before they are built. It uses special languages like Verilog or VHDL to mimic how signals move through an FPGA, ensuring everything works correctly.

[^2]: An FPGA (Field-Programmable Gate Array) is a customizable chip that can be programmed to do different tasks. Unlike regular chips that do one thing, an FPGA can change its function, making it versatile for various jobs.

[^3]: A description of all the devices (gates) and all of the connections (wires) between each device

[^4]: A web interface is a user-friendly website or online tool that lets you interact with a system or application through your web browser. It's like a control panel on the internet where you can click buttons, enter information, and see results without needing special software.

[^5]: A netlist is like a recipe for building an electronic circuit. It tells you what components you need and how to put them together (connections) to create a functioning circuit.