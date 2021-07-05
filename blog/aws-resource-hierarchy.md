---
title: AWS Resource hierarchy
tags:
- aws
date: 2021-07-03
---

## Overview

Scenario:
- A company size of `200` people seperated into `10` teams.
- Administer can have the company-wide policy to limit AWS account.
- Easy way to switch user to the other team.
- Single login page for user to login
- Each team wants its own access to its resources.
- Also, different environment for specific purpose.
- Sometimes, they need temporarily cooperation between teams.
- For auditing, bills should be seperated by each team.

Solution:

- [AWS Organization](https://aws.amazon.com/tw/organizations/) to have hiearchy architecture.
- Move AWS Accounts into different [Organizational Unit](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_ous.html).
- Attach [Service Control Policies](https://docs.aws.amazon.com/organizations/latest/userguide/orgs_manage_policies_scps.html) to OU to limit AWS accounts.
- Using seperated account for different enviroment, producion, staging...... .

import Mermaid from '@theme/Mermaid';

<Mermaid chart={`
	graph LR;
		R[Organization root] --> C[Company OU];
		C[Company OU] --> A1[Team A production account];
		C[Company OU] --> A2[Team A staging account];
		C[Company OU] --> B1[Team B production account];
		C[Company OU] --> B2[Team B staging account];
		R[Organization root] --> P[playground account];
`}/>

Company OU will whitelist AWS resource and region.
Playground account has no limitation on AWS resource.
Periodically clean resource of playground account.

:::info

[AWS Tag](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/cost-alloc-tags.html) is another solution to have more detail bill within AWS account.

:::

## SSO

:::caution

Recommended using SSO to manage AWS Accounts, otherwise you will have to manage your account from different place.

:::

### Google apps SSO

:::warning

You have to have GSuite super administrator access.

:::

Follow the [How to Set Up Federated Single Sign-On to AWS Using Google Apps](https://aws.amazon.com/blogs/security/how-to-set-up-federated-single-sign-on-to-aws-using-google-apps/) instruction

Then, you will find out it's one-to-one mapping between Google account and IAM role.

We want mapping of Google group and IAM role.

Refer repo [https://github.com/1Strategy/sso-to-aws-using-gsuite](https://github.com/1Strategy/sso-to-aws-using-gsuite)

By using GSuite Admin API

Iterate the Google group, for each Google account, map to corresponding IAM role

## AWS SSO

[https://aws.amazon.com/tw/single-sign-on/](https://aws.amazon.com/tw/single-sign-on/)

<Mermaid chart={`
	graph LR;
		A[A account admin group] --> AA[Administer role of A account];
		A[A account readonly group] --> AR[readonly role of account];
		B[B account admin group] --> BA[Administer role of A account];
		B[B account readonly group] --> BR[readonly role of account];
`}/>

Assign user to group to have access to account.

[Neat short-term credentials for command line interface](https://aws.amazon.com/blogs/security/aws-single-sign-on-now-enables-command-line-interface-access-for-aws-accounts-using-corporate-credentials/)
