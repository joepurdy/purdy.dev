---
title: "ModernIE for Vagrant Reloaded"
date: 2015-10-20T11:15:00-07:00
author: "Joe Purdy"
description: "Modern.IE vagrant boxes configured the right way"
slug: "2015/10/modernie-for-vagrant-reloaded"
tags:
  - "windows"
  - "internet explorer"
  - "microsoft edge"
  - "vagrant"
archived: true
---

> **UPDATE:** I've made the decision to retire the ModernIE VMs, check out the [official announcement](/posts/2016/06/retiring-modernie-vagrant-boxes/) for details.

I published patched vagrant boxes last month for Microsoft's [ModernIE Virtual Machines](http://dev.modern.ie/tools/vms/) on Hashicorp's ~~Vagrant Cloud~~ [Atlas](https://atlas.hashicorp.com/modernIE/) and talked about the process in a [previous blog post](/posts/2015/08/modernie-vagrant-boxes/). After letting them loose in the wild and discussing them over on [reddit](https://www.reddit.com/r/vagrant/comments/3hwqrh/windows_modernie_vagrant_boxes_on_vagrant_cloud/) I've learned a few things and wanted to do a follow-up to cover some of the unexpected peculiarities encountered so far by myself as well as the vagrant community.

#### Rearming is as simple as `vagrant reload`, right? 
### WRONG

So I was naïve in thinking it would be as simple as issuing a reload command to rearm these VMs. Microsoft's licensing works out in a way that the machines have a hard expiration in place of roughly 11/21/2015. This is due to the fact that I had to boot the machines once to configure WinRM correctly and when that occurred a 90 day trial countdown began.

At first my plan was to just re package a fresh box for each VM every 60 - 90 days and push updates to Atlas so that people would get notified to update their boxes once the trial ran out. A noble effort, but not one I'm likely to keep up on.

##### Player 3 has entered the game
My new strategy is to hopefully work with Microsoft to make these boxes available. As it turns out around the same time I was making my patched vagrant boxes available on Atlas Microsoft was busy resurrecting the promise made in Cory Fowler's [original blog post](http://blog.syntaxc4.net/post/2014/09/03/windows-boxes-for-vagrant-courtesy-of-modern-ie.aspx) about ModernIE Vagrant boxes.

![vagrant modernIE](https://i.imgur.com/qnX5zmB.jpg)

Microsoft started providing native ModernIE Vagrant boxes sometime between 9/16/2015 based off the build number they're using and 10/1/15 based on this tweet. 

<blockquote class="twitter-tweet" lang="en"><p lang="en" dir="ltr"><a href="https://twitter.com/hashtag/vagrant?src=hash">#vagrant</a> boxes for all IE versions and MSEdge are now available in <a href="http://t.co/lj44hkSeJD">http://t.co/lj44hkSeJD</a></p>&mdash; Microsoft Edge Dev (@MSEdgeDev) <a href="https://twitter.com/MSEdgeDev/status/649714768073240576">October 1, 2015</a></blockquote>

I'm currently experimenting with these new Vagrant boxes to determine if they're a better fit for updating the cloud hosted boxes on the [Atlas ModernIE](https://atlas.hashicorp.com/modernIE/) page. My current guess is that they still lack the proper WinRM configuration to make the `vagrant rdp` command functional out of the box.

My hope is that they can at least provide a better starting point for keeping the license valid or that I can work with Microsoft to make their boxes the de facto standard. I'll update this post as I learn more.

###### Update 2015-10-20 15:30 UTC−7
It appears that the Microsoft sanctioned ModernIE Vagrant boxes actually don't have WinRM configured correctly after all. This doesn't really come as a suprise, but I'm still hoping it's something they can patch with the right feedback. I'm going to proceed with the original plan of rebuilding each box with a fresh 90 day license. I should have this completed sometime tonight or tomorrow.

###### Update 2015-10-23 16:30 UTC−7
I've finished rolling updates to the correct ModernIE vagrant machines. They can each be seen on Atlas at the [ModernIE](https://atlas.hashicorp.com/modernIE/) page. I haven't updated the `vista-ie7` box yet due to the low usage numbers. I'll probably update that one and add the XP boxes this weekend for the hell of it.

Using the boxes is simple now that I've baked the WinRM configuration into the default machine Vagrantfile. Simply running `vagrant init modernIE/w10-edge; vagrant up` will generate a Vagrantfile and fetch the Windows 10 w/ Edge and IE11 box from Atlas. **Keep in mind these Windows VMs are HUGE (4-8Gb).** This means the initial download could take 30 minutes or longer depending on your internet connection and they'll occupy a decent chunk of your computer's storage drive.

Once the vagrant provisioning is complete and the machine is running you can issue a `vagrant rdp` command to launch a Remote Desktop connection. 

![bootstrap vagrant](https://i.imgur.com/qmpOILp.jpg)

The login details are the default ModernIE credentials:

**Username:** IEUser<br>
**Password:** Passw0rd!

>*I've tested this on Windows and it works due to RDP being enabled by default. I will test out on my MacBook later tonight and report back any additional config necessary.*

### Vagrantfiles
You can also use a custom Vagrantfile if you want to instead of what is provided by `vagrant init modernIE/<box>`. I have a master file I use [hosted on Github](https://github.com/joepurdy/Vagrantfiles/blob/master/ModernIE.vagrantfile) which is configured like this:

```
# -*- mode: ruby -*-
# vi: set ft=ruby :

=begin
ModernIE VMs

config.vm.box = "modernIE/vista-ie7"
config.vm.box = "modernIE/w7-ie8"
config.vm.box = "modernIE/w7-ie9"
config.vm.box = "modernIE/w7-ie10"
config.vm.box = "modernIE/w7-ie11"
config.vm.box = "modernIE/w8-ie10"
config.vm.box = "modernIE/w8.1-ie11" 
config.vm.box = "modernIE/w10-edge"

System Account Credentials
Username: IEUser
Password: Passw0rd!
=end

Vagrant.configure("2") do |config|
  config.vm.box = "modernIE/w10-edge"

  config.vm.provider "virtualbox" do |vb|
    vb.customize ["modifyvm", :id, "--memory", "1024"]
    vb.customize ["modifyvm", :id, "--vram", "128"]
    vb.customize ["modifyvm", :id,  "--cpus", "2"]
    vb.customize ["modifyvm", :id, "--natdnsproxy1", "on"]
    vb.customize ["modifyvm", :id, "--natdnshostresolver1", "on"]
    vb.customize ["guestproperty", "set", :id, "/VirtualBox/GuestAdd/VBoxService/--timesync-set-threshold", 10000]
  end
end
```

### Updating
If you previously used these vagrant boxes you should get prompted to update on your next provisioning, the message looks like this:
![update vagrant box](https://i.imgur.com/rivOkAn.jpg)

Updating is a breeze though, just run `vagrant box update` to pull in the latest version.

### Feedback
I'd love feedback from the Vagrant and Windows community on this project. If anyone has questions, concerns, or just general comments please leave them below or [contact me](mailto:joe@poweredbypurdy.com?subject=ModernIE%20Vagrant%20Boxes) directly via email to discuss.
