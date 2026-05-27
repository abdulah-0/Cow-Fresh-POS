# Feature Modification Document

## Dairy Shop POS System – Additional Module & UI Enhancements

**Project:** Dairy Shop POS System
**Document Type:** Feature Modification Requirements
**Version:** 1.0
**Prepared By:** Abdullah Khalid
**Date:** May 2026

---

# 1. Overview

This document outlines the additional modifications and enhancements required for the Dairy Shop POS System.

The updates focus on:

* Customer Zone Integration
* Dispatch Module Enhancements
* New Packing Module
* Automatic Stock Synchronization
* Remaining Milk Tracking
* Mobile-Friendly UI Improvements

These changes are intended to improve operational workflow, rider dispatch management, inventory accuracy, and overall usability across desktop and mobile devices.

---

# 2. Customer Module Enhancements

# Objective

Enhance the customer module to integrate directly with the zone management system and simplify the customer creation form.

---

# Required Changes

## Add Zone Selection Dropdown

A new dropdown field named:

### “Zone”

will be added to the customer creation and edit forms.

---

# Functionality

When a customer is created:

1. Admin selects a zone from dropdown
2. Customer is automatically linked to that zone
3. Customer automatically appears inside the selected zone in the Zones module
4. Zone customer count updates automatically

---

# Example Workflow

## Customer Creation

### Selected Zone:

* Zone A — Bahria Town

Result:

* Customer is stored with Zone A ID
* Zones module instantly reflects updated customer list

---

# Customer Form Changes

# Remove The Following Fields

The following fields should be removed completely from the customer form:

* Email
* State
* ZIP Code

---

# Updated Customer Form Fields

| Field         | Status   |
| ------------- | -------- |
| Customer Name | Keep     |
| Phone Number  | Keep     |
| Address       | Keep     |
| Zone Dropdown | Add      |
| Notes         | Optional |

---

# Backend Changes

## Database Updates

### customers table

| Field            | Type |
| ---------------- | ---- |
| zone_id          | FK   |
| delivery_address | Text |

---

# API Updates

## Updated APIs

* Create Customer API
* Update Customer API
* Fetch Customers by Zone API

---

# Frontend Changes

## Customer Form UI

Add:

* Searchable zone dropdown
* Mobile-friendly form layout
* Auto-zone synchronization

---

# 3. Dispatch Module Enhancements

# Objective

Enhance rider dispatch tracking by recording packet-level milk and yogurt movement.

---

# Required Changes

## Add New Fields to Dispatch Form

The following fields should be added:

| Field                  | Type   |
| ---------------------- | ------ |
| Picked Milk Packets    | Number |
| Dropped Milk Packets   | Number |
| Picked Yogurt Packets  | Number |
| Dropped Yogurt Packets | Number |

---

# Functional Workflow

## Before Delivery

Admin/Cashier enters:

* Total milk packets picked
* Total yogurt packets picked

---

# After Delivery Completion

Admin enters:

* Milk packets dropped/returned
* Yogurt packets dropped/returned

---

# Automatic Calculations

## Delivered Packets

Delivered Milk Packets =
Picked Milk Packets - Dropped Milk Packets

Delivered Yogurt Packets =
Picked Yogurt Packets - Dropped Yogurt Packets

---

# Dispatch Module Features

* Rider packet accountability
* Product movement tracking
* Daily dispatch reconciliation
* Rider inventory history

---

# Database Updates

## dispatch_records table updates

| Field                  | Type    |
| ---------------------- | ------- |
| picked_milk_packets    | Integer |
| dropped_milk_packets   | Integer |
| picked_yogurt_packets  | Integer |
| dropped_yogurt_packets | Integer |

---

# Frontend Changes

## Dispatch Form Updates

* Add numeric packet fields
* Add auto-calculation summary
* Mobile-optimized form layout

---

# 4. New Packing Module

# Objective

Create a new module named:

# “Packing”

This module will convert total daily milk supply into packaged dairy products while automatically updating inventory stock levels.

---

# Packing Module Workflow

## Daily Milk Supply Entry

Admin enters:

* Total milk received for the day

Example:

* 500 KG milk received

---

# Product Packing Conversion

Milk is converted into products such as:

| Product     | Quantity    |
| ----------- | ----------- |
| Milk 1 KG   | 100 packets |
| Milk 500 ML | 200 packets |
| Yogurt 1 KG | 50 packets  |

---

# Automatic Inventory Update

When products are packed:

1. Item stock automatically increases
2. Inventory module updates in real time
3. Item quantities reflect packaged products

---

# Example

## Packing Entry

Milk 1 KG = 100 packets

Result:

* Item stock for “Milk 1 KG” increases by 100

---

# Remaining Milk Tracking

The module should continuously calculate:

# Remaining Milk

Formula:

Remaining Milk =
Total Milk Received - Milk Used In Packed Products

---

# Features

## Packing Dashboard

Display:

* Total Milk Received
* Total Milk Used
* Remaining Milk
* Product Packing Summary

---

# Packing Module Features

* Daily packing entries
* Product conversion tracking
* Automatic inventory synchronization
* Remaining milk analytics
* Packing history logs

---

# Database Tables

## packing_entries

| Field               | Type    |
| ------------------- | ------- |
| id                  | UUID    |
| date                | Date    |
| total_milk_received | Decimal |
| total_milk_used     | Decimal |
| remaining_milk      | Decimal |

---

## packing_products

| Field             | Type    |
| ----------------- | ------- |
| packing_entry_id  | FK      |
| product_id        | FK      |
| quantity_produced | Integer |

---

# Backend Logic

# Automatic Stock Synchronization

When packing is completed:

1. Product stock updates automatically
2. Inventory recalculates
3. Milk balance recalculates

---

# API Development

## New APIs

* Create Packing Entry
* Add Packed Products
* Fetch Remaining Milk
* Fetch Daily Packing Summary

---

# Frontend Changes

## New Sidebar Module

### Packing

---

# Packing Screens

| Screen               | Purpose          |
| -------------------- | ---------------- |
| Packing Dashboard    | Milk analytics   |
| Create Packing Entry | Daily production |
| Packing History      | Historical logs  |

---

# 5. Automatic Item Stock Updates

# Objective

Ensure all packed products automatically update inventory quantities in the Items module.

---

# Functional Flow

## Example

Admin packs:

* 100 Milk 1 KG packets

System automatically:

* Adds +100 stock to Milk 1 KG item

---

# Inventory Synchronization Features

* Real-time stock updates
* Auto inventory refresh
* Product quantity recalculation

---

# Backend Requirements

## Inventory Service Updates

Packing module must trigger:

* Stock increment operations
* Inventory recalculations
* Product availability updates

---

# 6. Total Milk Remaining System

# Objective

Display real-time remaining milk across the system.

---

# Remaining Milk Calculation

Formula:

Remaining Milk =

Total Milk Received

* Packed Milk Usage
* Sales
* Deliveries

---

# Dashboard Widgets

## Add New Cards

* Total Milk Received
* Milk Used In Packing
* Milk Sold
* Milk Delivered
* Remaining Milk

---

# Reports

## Milk Reports

Generate:

* Daily milk usage reports
* Packing efficiency reports
* Remaining milk reports

---

# 7. Mobile-Friendly UI Enhancements

# Objective

Redesign the application UI to work efficiently on:

* Mobile phones
* Tablets
* Desktop systems

---

# UI Requirements

## Responsive Design

The application should automatically adapt to:

* Small mobile screens
* Medium tablet screens
* Large desktop screens

---

# Mobile UI Improvements

## Sidebar

* Collapsible mobile sidebar
* Hamburger menu support
* Bottom navigation support (optional)

---

# Forms

All forms should be:

* Fully responsive
* Touch-friendly
* Easy to use on small screens

---

# Tables

Convert large tables into:

* Scrollable mobile tables
* Card-based layouts on mobile

---

# Dashboard Enhancements

Dashboard widgets should:

* Stack vertically on mobile
* Resize automatically
* Maintain readability

---

# Frontend Technical Requirements

# Recommended Technologies

| Feature               | Technology         |
| --------------------- | ------------------ |
| Responsive Layout     | CSS Grid + Flexbox |
| UI Framework          | Material UI        |
| Mobile Responsiveness | MUI Breakpoints    |
| Navigation            | Responsive Drawer  |

---

# Mobile Optimization Features

* Optimized touch targets
* Faster mobile rendering
* Reduced UI clutter
* Mobile-friendly modals
* Adaptive typography

---

# 8. Updated Sidebar Structure

# New Sidebar Modules

| Module    | Status  |
| --------- | ------- |
| Dashboard | Keep    |
| Customers | Updated |
| Zones     | Keep    |
| Dispatch  | Updated |
| Packing   | New     |
| Riders    | Keep    |
| Inventory | Keep    |
| Invoices  | Keep    |

---

# Removed Modules

| Module    | Status |
| --------- | ------ |
| Wastage   | Remove |
| Locations | Remove |

---

# 9. Final Outcome

After implementation, the Dairy POS system will include:

* Zone-integrated customer management
* Advanced dispatch tracking
* Smart packing management
* Automatic inventory synchronization
* Real-time milk tracking
* Mobile-friendly responsive UI
* Improved rider accountability
* Better inventory visibility
* More efficient dairy operations

The final system will function as a complete dairy production, delivery, and inventory management platform optimized for both desktop and mobile usage.
