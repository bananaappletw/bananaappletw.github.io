---
title: AWS account strategy
categories:
- computer science
tags:
- aws
date: 2020-05-24T12:27:34.000+00:00

---
## 基本介紹

登入介面會需要

* Account ID (12 digits) or account alias
* IAM user name

AWS account: 12 digits 和 account alias 都是獨特的(大部分程式方面都要寫 12 digits 的數字)

IAM user

* 可以用來登入 console 的帳號
* 提供 credential 給 CI/CD 跑的帳號
* 可以自己加或是用 group 的方法掛 IAM policy

IAM role

* 給別的 account 的 IAM user 用的
* 給 EC2 用的
* 給別的 identity provider 用的

IAM policy

* 存取 resource 權限的表達方法

主要想做到的目標

* 每個 team 之間權限分開管理 teamA 的人不能存取 teamB 的 service  
  但是有必要的時候可以有跨 team 合作(某一 group 的人有權限存取 teamB 的資源)  
  合作結束再把權限拔掉之類的
* 帳單可以分開算(會計)
* development environment 分開，prod只可以某些人碰，dev 可能大家都可以存取

比較理想的管理方法用 AWS Organization 去分不同的 team 和environment

[https://aws.amazon.com/tw/organizations/](https://aws.amazon.com/tw/organizations/ "https://aws.amazon.com/tw/organizations/")

* A-prod
* A-dev
* A-test
* B-prod
* B-dev
* B-test

AWS Organization 會有一個帳號綁有信用卡資訊叫做 master account(用來付錢的)

在這個 AWS Organization 以外帳號的開銷都由他負責

這樣就可以把每個 team 的帳單分開了(雖然有 tag 可以用只是感覺不太好用)

[https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/cost-alloc-tags.html](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/cost-alloc-tags.html "https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/cost-alloc-tags.html")

每個 group 掛不同的權限

想要有那個權限就把 user 加到 group 裡

不需要的時候將他移出 group

接下來要選擇的就是 Single Sign On 的方法了

## Switch Role

最陽春的方法

想辦法讓大家有同一個登入點(比如說 master account)

但是只給他最低的權限(只可以看自己的 My Security Credentials page)

[https://docs.aws.amazon.com/zh_tw/IAM/latest/UserGuide/reference_policies_examples_aws_my-sec-creds-self-manage-no-mfa.html](https://docs.aws.amazon.com/zh_tw/IAM/latest/UserGuide/reference_policies_examples_aws_my-sec-creds-self-manage-no-mfa.html "https://docs.aws.amazon.com/zh_tw/IAM/latest/UserGuide/reference_policies_examples_aws_my-sec-creds-self-manage-no-mfa.html")

和 Switch Role 到某個 IAM role 的權限

[https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_use_permissions-to-switch.html](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_use_permissions-to-switch.html "https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_use_permissions-to-switch.html")

你需要一個共通的 group(`users`) 掛 `ViewMySecurityCredentials` policy

其他個別的 group 去設定可以 switch role 的權限

這作法設定有點複雜不怎麼推薦

## Google apps SSO

用 Google 帳號登入 aws console

你要有 Gsuite 的 super administrator 的權限

基本上參考 aws 官網的 blog 就可以了

[https://aws.amazon.com/blogs/security/how-to-set-up-federated-single-sign-on-to-aws-using-google-apps/](https://aws.amazon.com/blogs/security/how-to-set-up-federated-single-sign-on-to-aws-using-google-apps/ "https://aws.amazon.com/blogs/security/how-to-set-up-federated-single-sign-on-to-aws-using-google-apps/")

只是做完後你會發現它是 Google 帳號和 IAM role 一對一的對應

這和一般我們希望做到的管理有些出入

比較理想的是 Google group 和 IAM 的對應

這個可以參考這個 repo

[https://github.com/1Strategy/sso-to-aws-using-gsuite](https://github.com/1Strategy/sso-to-aws-using-gsuite "https://github.com/1Strategy/sso-to-aws-using-gsuite")

使用 GSuite Admin API 做成 google group 和 IAM 的對應

作法是先去找出 google group 裡的 memeber 然後一個一個修改對應到的 IAM role

優點: aws account 填的 email 可以是 Google group 的 email 這樣所有在那個 group 的人都可以收到 email，通常會寄一些資源預警信，所以收信的人必須要有 aws 權限去處理這些事，蠻一致的

缺點: 會把 trust 綁在 Google 上

## AWS SSO

AWS 本身的 Single Sign On service

[https://aws.amazon.com/tw/single-sign-on/](https://aws.amazon.com/tw/single-sign-on/ "https://aws.amazon.com/tw/single-sign-on/")

這大概是最簡單的方法了

在看 Google Apps 的時候就在想

既然可以用 Google 當作 identity provider

那我可不可以用 AWS 自己當作 identity provider 呢

設定蠻簡單的

去有 AWS SSO service 的 region

選第一個 AWS SSO 當作你的 identity source

可以做到的就是一個 group 對應多個 IAM policy

你登入後就可以選擇自己想要使用的 aws account 和裡面的 IAM user

缺點: 收 email 方面和 Google apps SSO 相比每次加 user 或移除 user 都要再去 Gsuite group 改一次

## Reference

* [https://aws.amazon.com/blogs/mt/tag/aws-multi-account-management/](https://aws.amazon.com/blogs/mt/tag/aws-multi-account-management/ "https://aws.amazon.com/blogs/mt/tag/aws-multi-account-management/")
* [https://d0.awsstatic.com/aws-answers/AWS_Multi_Account_Security_Strategy.pdf](https://d0.awsstatic.com/aws-answers/AWS_Multi_Account_Security_Strategy.pdf "https://d0.awsstatic.com/aws-answers/AWS_Multi_Account_Security_Strategy.pdf")