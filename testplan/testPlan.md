# Test Plan for Web FPGA Project

**Author:** Mathis Lebel  
**Created on:** 13/03/2025  
**Last Modified:** 25/03/2025  

## Table of Contents

- [I. Introduction](#i-introduction)
- [Objective of the Document](#objective-of-the-document)
  - [II. Quality Objectives](#ii-quality-objectives)
    - [A. Primary Objectives](#a-primary-objectives)
    - [B. Secondary Objectives](#b-secondary-objectives)
  - [III. Test Scope](#iii-test-scope)
    - [A. Web FPGA Software Scope](#a-web-fpga-software-scope)
    - [B. Web FPGA Hardware Scope](#b-web-fpga-hardware-scope)
    - [C. Documentation Scope](#c-documentation-scope)
    - [D. Out of Scope](#d-out-of-scope)
  - [IV. Testing Strategy](#iv-testing-strategy)
    - [A. Unit Tests](#a-unit-tests)
    - [B. Test Structure](#b-test-structure)
    - [C. Test List](#c-test-list)
      - [1. Visualization](#1-visualization)
      - [2. Examples](#2-examples)
      - [3. Time Control](#3-time-control)
      - [4. Compatibility](#4-compatibility)
      - [5. Security](#5-security)

## I. Introduction

The Web FPGA project aims to develop a web-based interface for simulating and visualizing signal propagation in an FPGA (Field-Programmable Gate Array). This tool is designed to help teachers and students understand how signals propagate in an FPGA system through interactive 2D animations. The project is commissioned by CNES (Centre National d'Études Spatiales) and serves as an educational tool for FPGA concepts.

### Objective of the Document

This document describes the test strategy for the Web FPGA project. It defines quality objectives, test scope, and detailed test cases to ensure the application meets functional and non-functional requirements. The goal is to ensure the application is stable, user-friendly, and functions correctly across different platforms and browsers.

## II. Quality Objectives

### A. Primary Objectives

The primary testing objectives are to validate that the application meets the core functional requirements, including:

- **Visualization:** The 2D representation of the FPGA system with animations for signal propagation.
- **Examples:** The ability to load and visualize default examples (e.g., D flip-flop, LUT4) and custom examples provided by the teacher.
- **Time Control:** The ability to pause, resume, and adjust animation speed.
- **Compatibility:** The application must run smoothly on major web browsers (Chrome, Edge, Safari, Firefox).
- **Security:** If the application is hosted online, it must protect user data and ensure integrity.

### B. Secondary Objectives

Secondary objectives focus on additional features and improvements, such as:

- **User Interface:** The interface should be intuitive and responsive.
- **Customization:** Teachers should be able to upload and use custom Verilog and SDF files.
- **Performance:** The application should load quickly and run animations smoothly.

## III. Test Scope

### A. Web FPGA Software Scope

The tests will focus on the following software components:

- **Visualization:** Ensure the 2D FPGA system representation is accurate and animations are smooth.
- **Examples:** Validate that default and custom examples load and display correctly.
- **Time Control:** Test the play, pause, reset, and speed control features.
- **Compatibility:** Verify that the application works on different browsers and screen resolutions.
- **Security:** Ensure data protection measures are in place if the application is hosted online.

### B. Web FPGA Hardware Scope

Since this is a web application, hardware testing is limited to ensuring compatibility with different operating systems (Windows, Linux, macOS).

### C. Documentation Scope

Documentation will be tested for:

- **Accuracy:** Ensuring all instructions and explanations are correct.
- **Clarity:** Verifying that the documentation is easy to understand.
- **Completeness:** Ensuring all necessary information is included.

### D. Out of Scope

The following elements are not included in testing:

- **Mobile Compatibility:** The application is not optimized for mobile devices.
- **Low-Level FPGA Simulation:** The focus is on visualization, not low-level simulation.

## IV. Testing Strategy

### A. Unit Tests

Unit tests will be conducted to validate individual application components, such as:

- **Visualization Engine:** Ensuring 2D representation and animations function as expected.
- **File Analysis:** Verifying that Verilog and SDF files are correctly parsed.
- **Time Control:** Testing play, pause, reset, and speed control functionalities.

### B. Test Structure

Each test case will include:

- **Function:** The component or feature being tested.
- **Test Description:** A detailed scenario of the test.
- **Severity:** The criticality of the test (High, Medium, Low).

### C. Test List

#### 1. Visualization

| Function | Test Description | Severity |
|----------|-----------------|----------|
| 2D Representation | Ensure the 2D FPGA system representation is accurate. | High |
| Signal Animations | Verify that clock and data signal animations are smooth and precise. | High |
| Component Labels | Check that component types, IDs, inputs, and outputs are displayed correctly. | Medium |
| Signal Delays | Ensure that signal delays between components are correctly displayed. | Medium |

#### 2. Examples

| Function | Test Description | Severity |
|----------|-----------------|----------|
| Default Examples | Verify that default examples (D flip-flop, LUT4) load and display correctly. | High |
| Custom Examples | Ensure that custom Verilog and SDF files can be uploaded and visualized. | High |

#### 3. Time Control

| Function | Test Description | Severity |
|----------|-----------------|----------|
| Play/Pause Button | Ensure the play/pause button starts and stops animations. | High |
| Reset Button | Verify that the reset button restarts the animation from the beginning. | High |
| Speed Control | Test speed control options (0.5x, 1x, 2x, etc.) to ensure they work correctly. | Medium |

#### 4. Compatibility

| Function | Test Description | Severity |
|----------|-----------------|----------|
| Browser Compatibility | Ensure the application works on Chrome, Edge, Safari, and Firefox. | High |
| Screen Resolution | Ensure the interface is responsive and adapts to different screen sizes. | Medium |

#### 5. Security

| Function | Test Description | Severity |
|----------|-----------------|----------|
| Data Protection | Ensure user data is protected if the application is hosted online. | High |
| File Validation | Verify that only valid Verilog and SDF files can be uploaded. | Medium |
