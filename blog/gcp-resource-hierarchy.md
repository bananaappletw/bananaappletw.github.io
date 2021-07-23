---
title: GCP resource hierarchy
tags:
- gcp
date: 2021-07-23
---

## Overview

Scenario:

- A company size of `200` people seperated into `10` teams.
- Administer can have the company-wide policy to limit GCP account.
- Easy way to switch user to the other team.
- Single login page for user to login
- Each team wants its own access to its resources.
- Also, different environment for specific purpose.
- Sometimes, they need temporarily cooperation between teams.
- For auditing, bills should be seperated by each team.

Solution:

- [Google Group](https://support.google.com/groups) to grouping user by team or functionality.
- [Nesting](https://support.google.com/a/answer/167100) group to organize members within the team.
- [GCP folder](https://cloud.google.com/resource-manager/docs/creating-managing-folders) to have hiearchy architecture.
- Set [IAM](https://cloud.google.com/resource-manager/docs/access-control-folders) role by Google Group email
- Set [Organization Policy](https://cloud.google.com/resource-manager/docs/organization-policy/overview) on GCP folder limit resource.
- Using seperated GCP folder for different enviroment, producion, staging...... .

import Mermaid from '@theme/Mermaid';

## Organization

<Mermaid chart={`
	graph LR
		R[Organization root] --> A[Team A folder]
		R[Organization root] --> B[Team B folder]
		A[Company folder] --> A1[Team A production folder]
		A[Company folder] --> A2[Team A staging folder]
		B[Company folder] --> B1[Team B production folder]
		B[Company folder] --> B2[Team B staging folder]
		R[Organization root] --> P[playground folder]
`}/>


## Nested Google Group

<Mermaid chart={`
graph LR
    subgraph A [Team A Google Group]
    A1[Team A production Google Group]
    A2[Team A staging Google Group]
    end
`}/>

## IAM relationship between Google Group and Google project

<Mermaid chart={`
	graph LR
		A[Team A Google Group] -- Folder Admin/Owner -->AF[Team A folder]
		A1[Team A production Google Group] -- Folder Admin/Owner -->A1F[Team A production folder]
		A2[Team A production Google Group] -- Folder Admin/Owner -->A2F[Team A staging folder]
		P[playground Google Group] -- Folder Admin/Owner -->PF[Team B playground folder]
`}/>

## Terraform

- [Seed project](https://femrtnz.medium.com/automating-gcp-projects-with-terraform-d571f0d94742) (Not Recommanded)

Create service account per GCP project as Terraform repo's credential.

- [one-to-one mapping between Terraform repo and GCP project](https://registry.terraform.io/providers/hashicorp/google/latest/docs)

<Mermaid chart={`
	graph LR;
		A[A GCP project] --> AT[A Terraform repo];
		AT[A Terraform repo] --> A[A GCP project];
		B[B GCP project] --> BT[B Terraform repo];
		BT[B Terraform repo] --> B[B GCP project];
`}/>
