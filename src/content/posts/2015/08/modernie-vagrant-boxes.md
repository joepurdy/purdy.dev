---
title: "ModernIE Vagrant Boxes"
date: 2015-08-21T15:09:00-07:00
author: "Joe Purdy"
description: "Get the lowdown on quick and simple configuration of ModernIE Windows virtual machines using Vagrant"
slug: "2015/08/modernie-vagrant-boxes"
tags:
  - "windows"
  - "internet explorer"
  - "microsoft edge"
  - "vagrant"
archived: true
---

> **UPDATE:** I've made the decision to retire the ModernIE VMs, check out the [official announcement](/posts/2016/06/retiring-modernie-vagrant-boxes/) for details.

I've been working on a few different automation projects that require a Windows test agent and naturally I've grown increasingly frustrated with the Windows OS at large. 

To their credit, Microsoft has a [great developer resource site](https://dev.modern.ie/) for their OS and web browsers. They also provide a set of virtual machine images for testing the many iterations of Internet Explorer.

This is actually really useful seeing as the process of upgrading and downgrading Internet Explorer releases is fraught with perils. I wanted to take it one step further however and package their virtualbox images into [Vagrant](https://www.vagrantup.com/) boxes for more rapid deployment. 

## Enter the Vagrant Cloud

Packaging the images for Vagrant ended up being quite a hassle. Admittedly this is largely due to my lack of RAM in my current MacBook, it's tough building 10 different virtual machines on only 4Gb of memory!

Lucky for the rest of the world now that I've suffered this hardship no one else should have to go through the same ordeal. My completed vagrant box conversions of the ModernIE VMs are available for [download directly from Hashicorp's Atlas](https://atlas.hashicorp.com/modernIE/).

## Technical Details

I kept each box as close to the vanilla ModernIE VM it was based off of as possible. 
I only made these notable changes:

* Set default network type to Work
* Configured winRM to allow Vagrant to communicate during provisioning
* Installed [chocolatey](https://chocolatey.org/) package manager
* Installed [Puppet](https://puppetlabs.com/) provisioner

## The good stuff

I've created a [gist](https://gist.github.com/joepurdy/28b894574cee15344918) listing a template for using these slick ModernIE Vagrant boxes. Simply save the Vagrantfile wherever you see fit and change the `config.vm.box = "modernIE/w7-ie11"` to whichever VM you'd like to start up. I even included a handy comment up top with all the VMs available.

Once you get your Vagrantfile configured the way you like simply issue a trusty `vagrant up` command from the directory you saved it in to make the magic happen. After the VM finishes provisioning you can use the `vagrant rdp` command to open a remote session. 

#### Login credentials
**User:** IEUser<br>**Password:** Passw0rd!

## The bad stuff

It's no secret that Windows is a bloated OS when compared to your favorite Linux distro. The VMs each range between 3Gb - 4.5Gb in size and the initial download from the Vagrant Cloud could take upwards of an hour or more depending on your bandwidth. 

Once you've finished downloading a VM for the first time starting new instances via Vagrant is much faster, however the downloaded VM will take up considerable space on your computer's storage drive.

## That's all folks!

This was a fun little project and I hope having easily accessible Windows images for Vagrant saves you some time. Feel free to leave any comments or questions you have below for me!
