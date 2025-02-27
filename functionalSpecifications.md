<h1 style='text-align: center'>Project's Name</h1>
<h2 style='text-align: center'> Functional Specification Document</h2>

---

<h3 style='text-align: center'>DOCUMENT VERSION 1.1</h3>
<h3 style='text-align: center'>02/25/2025</h3>


---

<h3>Author</h3>

| Name          | Role            |
| ------------- | --------------- |
| Alexis SANTOS | Program Manager |

<h3>Document History</h3>

| Date       | Version | Document Revision Description                                                                                                                                                                        |
| ---------- | :-----: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 02/24/2025 |   1.0   | <li> Create the document and make the Overview, A to E. </li> <li> Start the Glossary. </li>                                                                                                         |
| 02/25/2025 |   1.1   | After meeting with the client, some parts have changed. <li>Part of the client has been filled</li> <li>Fonctional Requirements have been partially wrotten</li> <li>Expected Deliverables has been added</li> |


<h3>Approvals</h3>

| Approval <br> Date | Approved <br> Version | Approver <br> Role | Approver <br> Name | Approvement |
| ------------------ | --------------------- | ------------------ | ------------------ | ----------- |
|                    |                       |                    |                    |             |
|                    |                       |                    |                    |             |
|                    |                       |                    |                    |             |

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
    - [Expected Deliverables](#expected-deliverables)
  - [E. Project Plan](#e-project-plan)
    - [Milestones](#milestones)
    - [Ressources / Financial Plan](#ressources--financial-plan)
- [II. Requirements](#ii-requirements)
  - [A. Functional Requirements](#a-functional-requirements)
    - [FPGA Simulator](#fpga-simulator)
      - [Teacher View / Backend](#teacher-view--backend)
      - [Student View / Frontend](#student-view--frontend)
    - [Three Views](#three-views)
      - [All Views](#all-views)
      - [Shematics Representation](#shematics-representation)
      - [Signals Graph](#signals-graph)
      - [FPGA board's Schematic](#fpga-boards-schematic)
- [Glossary](#glossary)


</details>

---

# I. Overview

Our client, Florant MANNI ask us to develop a web interface for an FPGA Simulator[^1]. This web interface will be used to teach people how the signals propagate inside an FPGA[^2]. For simplicity, we'll use the schematic of an FPGA board and animate it to show the movement of data and clock in the board.

## A. Purpose of the document

The purpose of this Functional Specification is to outline the requirements and design considerations for developing a web interface for an FPGA Simulator[^1]. This interface aims to provide an educational tool that visually demonstrates how signals propagate within an FPGA, enhancing users' understanding of FPGA behavior.

The document will detail the functionalities needed to merge a 2D floorplan representation of an FPGA with the dynamic propagation of signals over time. This includes integrating the layout resulting from synthesis and place-and-route (P&R) processes with timing simulation data. The goal is to create an interactive and intuitive platform that allows users to observe and analyze signal propagation using a testbench[^3] and timing netlist[^4], both written in Verilog.

By defining the scope, features, and user interactions, this specification will serve as a comprehensive guide for the development team to ensure the final product meets the educational objectives and technical requirements.

## B. Project Scope 

The project scope for developing the web interface[^5] for the FPGA Simulator includes the following key components and functionalities:

1. 2D floorplan Visualization:

   * Develop a graphical representation of the **FPGA layout**, displaying the arrangement of basic elements (BELs) and their interconnections.
   * Ensure the layout accurately **reflects** the post-synthesis and place-and-route (P&R) design.

<br>

2. Signal Propagation Simulation:
   
   * Integrate a timing simulator to **visualize** the propagation of clock signals within the FPGA with an animation.
   * Use a testbench and timing netlist, both written in Verilog, to drive the simulation and **demonstrate signal** behavior over time.

<br>

3. Double Interface:

   * A web interface is used by a student to interact with the webpage to **explore** and **understand** what happens in the system.
   * A backend interface is used by a teacher to give a script to the program to train the student with the web interface.

<br>  

4. Interactive User Interface:

   * Create an **intuitive** web interface that allows users to interact with the FPGA layout and observe signal propagation.
   * Include controls for **starting**, **pausing**, and **resetting** the simulation, as well as options to inspect signal states at specific points in time.

<br>

5. Educational Features:

   * Implement features that enhance learning, such as tooltips, annotations to explain FPGA concepts and signal behavior.
   * Provide options for users to **load different FPGA designs** and testbenches to explore various scenarios.

<br>

6. Technical Requirements:

    * Ensure the web interface is **compatible** with modern **web browsers** and responsive to different screen sizes.
    * Optimize performance to handle complex FPGA designs and real-time signal propagation simulations.
    * **If it share on the web**, implement security measures to protect user data and ensure the integrity of the simulation environment.

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
| Weekly Reports                      | Document (Markdown)                  | Every Friday | [Weekly Report Folder](Management/WeeklyReport)            |

## D. Project Organisation

### Project Representatives

| Project Owner | Represented by...                              |
| ------------- | ---------------------------------------------- |
| Florant MANNI | Represented by himself                         |
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
| Florant MANNI    | Have a tool to help him when he need to explain the Verilog / VHDL to a young user of FPGA.  |
| ALGOSUP Students | Learning the association with web language (HTML / CSS / JavaScript) with the Verilog (FPGA) |

### Project Roles

As defined at the beginning, the team is arranged in the following manner : 

| Role              | Description  (Can Change)                                                                                                                                           | Name             |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| Project Manager   | Is in charge of organization, planning, and budgeting. <br> Keep the team motivated.                                                                                | Loïc NOGUES      |
| Program Manager   | Makes sure the project meets expectation. <br> Is responsible for writing the Functional Specifications                                                             | Alexis SANTOS    |
| Technical Leader  | Makes the technical decision in the project. <br> Translates the Functional Specification into Technical Specifications. <br> Does code review.                     | Yann-Maël BOUTON |
| Software Engineer | Writes the code. <br> Participate in the technical design.                                                                                                          | Lucas MEGNAN     |
| Quality Assurance | Tests all the functionalities of a product to find bugs and issue. <br> Document bugs and issues. <br> Write the test plan. <br> Check that issues have been fixed. | Mathis LEBEL     |
| Technical Writter | Writes the user manual. <br> Participate in the technical design.                                                                                                   | Grégory PAGNOUX  |

### Expected Deliverables

For this project, the customer requested us to respect some deliverables:
* The source code need to be on a Git repository.
* An explainaton of how to run the software have to be present on the repository and/or in the website.
* An explaination of how to add an application example have to be present on the repository and/or in the website.
* In the website, minimum two applications examples must be usable on the website:
  * One for the flipflop.
  * One for the LUT4. 

## E. Project Plan 

### Milestones

| Milestones                   | Deadline   |
| ---------------------------- | ---------- |
| Functional Specifications V1 | 03/13/2025 |
| Technical Specifications V1  | 03/25/2025 |
| End of Development           | 04/01/2025 |
| Oral Presentation            | 04/04/2025 |


### Ressources / Financial Plan

We have an estimated total of 70 man-hours to complete this project. We have access to these resources:

* The team (6 people)
* Teachers
* 1 computer per team member 

This project is centered on an animation of an FPGA Simulator to explain how an FPGA system works.  

# II. Requirements

## A. Functional Requirements

This project is centered on an animation of an FPGA Simulator to explain how works an FPGA system.  

### FPGA Simulator

The project is based on an FPGA simulator. This one needs to follow these requirements: 
* A 2D floor plan of three views.
* The possibility of seeing the road taken by the clock signal in the board

However, the client requested two views / two main possibilities on this website/web app. The student view and the teacher view.

#### Teacher View / Backend

The teacher views being to be used by the teacher for severals reason: 

-  Have a possibility to add another example with his/her own Verilog file.
-  Have an access to a testbench.

#### Student View / Frontend

The student views in this way where the student can explore and discover FPGA properties and functionalities. However, this view needs to follow these requirements:   

- The 2D view of FPGA Simulator. 
- Navigation into the view with zoom and move. 
- Select the default example or the teacher example and see it by a view. 
- Select one of this three view : board, binary graphic or the components schematic.
- Click on a play button to pause or resume the animation. 
- Click on a button to select the speed of the animation.

### Three Views

In order to have a large amount of information, the student need to have three views. A view of a shematics representation of components, a graph of signals, and an FPGA board's schematic.

#### All Views

In this three views, the user have some features :

| 2D View & Navigation                                                                                                                                  | Time Control                                                                                                                                                                                                                                                          | Example used & Visualization                                                                                                                                                                       |
| ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <li>Navigate trough the the screen with delimitation </li> <li>Zoom on the screen to see more details or zoom out to watch the global schematic.</li> | <li>Have a pause and resume button to stop or continue the animation</li> <li>Have a controller / a button to select the speed of the animation between these choices : <br> <div style='text-align: center;'> x0.25 / x0.5 / x0.75 / x1 / x1.5 / x2 / x4 </div></li> | <li>Choose the exercise between the default example and the example from the file provided by the Teacher </li> <li>Select witch view we want to have information between those three views. </li> |


#### Shematics Representation

<div style='align-items: flex-start; overflow: hidden'>
   <img src='pictures\FPGAShematics.png' style='float: right; margin-left: 20px; max-width: 45%; width: 500px; height: auto; position: relative' alt='picture of a Schematic Representation' >
   <div style='flex: 1'>
   <p>
   The schematic view is a 2D plan representing components such as a flip-flop, BRAM or LUT4. The aim of this view is to understand how data and clock move through the components, and how the program works with the components from start to finish. <br> 
   The representation of data and clock signal travel are displayed thank to an animation. <br>
   
   For each components, some information about it must be displayed:
   <li>The type of the components (LUT / BRAM / Clock...) </li>
   <li>The id of the components (Q1, Clk...)</li>
   <li>Inputs and Outputs</li>
   Between all components, somme information must be displayed:
   <li>The delay to pass from the first to the second</li>
   <li>The type of data is transfered (clock, status...)</li> 
   </p>
</div>
<div style='clear: both'></div> 

#### Signals Graph

<div style='align-items: flex-start; overflow: hidden'>
   <img src='' style='float: right; margin-left: 20px; max-width: 45%; width: 500px; height: auto; position: relative' alt='signals graph' >
   <div style='flex: 1'>
   <p>

   </p>
</div>
<div style='clear: both'></div> 

#### FPGA board's Schematic


<div style='align-items: flex-start; overflow: hidden'>
   <img src='pictures\FPGABoardRepresentation.png' alt='picture of a part of the FPGA board' style='float: right; margin-left: 20px; max-width: 45%; width: 500px; height: auto; position: relative' >
   <div style='flex: 1'>
   <p>
   The FPGA board's schematic is a 2D floorplan used by the student to understand how the program send data and clock by signals. <br>
   In this view, the student need to have these features :<br>
   <li>Have an animation to show these clock and data signals.</li>
   <li></li>

   <br><br><br><br>
   However, in the conseption of the schematic, we need to make the best balance between reality and schematic to make it real and user friendly.
   </p>
</div>
<div style='clear: both'></div> 
 


# Glossary

[^1]: An FPGA Simulator is a tool that helps designers test digital circuits before they are built. It uses special languages like Verilog or VHDL to mimic how signals move through an FPGA, ensuring everything works correctly.

[^2]: An FPGA (Field-Programmable Gate Array) is a customizable chip that can be programmed to do different tasks. Unlike regular chips that do one thing, an FPGA can change its function, making it versatile for various jobs.

[^3]: A testbench is a crucial tool in the design and verification process, helping to ensure that digital circuits and systems function correctly before they are manufactured.

[^4]: A netlist is like a recipe for building an electronic circuit. It tells you what components you need and how to put them together (connections) to create a functioning circuit.

[^5]: A web interface is a user-friendly website or online tool that lets you interact with a system or application through your web browser. It's like a control panel on the internet where you can click buttons, enter information, and see results without needing special software.