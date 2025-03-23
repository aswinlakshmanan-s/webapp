packer {
  required_version = ">= 1.8.0"
  required_plugins {
    amazon = {
      version = ">= 1.0.0"
      source  = "github.com/hashicorp/amazon"
    }
    googlecompute = {
      version = ">= 1.0.0"
      source  = "github.com/hashicorp/googlecompute"
    }
  }
}

source "amazon-ebs" "ubuntu_node" {
  region                      = var.aws_region
  instance_type               = var.aws_machine_type
  subnet_id                   = var.aws_subnet_id
  associate_public_ip_address = true
  source_ami                  = var.aws_source_ami
  ssh_username                = var.ssh_username
  ami_name                    = var.ami_image_name

  launch_block_device_mappings {
    device_name           = var.aws_device_name
    volume_size           = var.aws_volume
    volume_type           = var.aws_volume_type
    delete_on_termination = true
  }
}

build {
  name    = "ubuntu-24-node"
  sources = [
    "source.amazon-ebs.ubuntu_node",
  ]

  # Copy the web application artifact into the instance
  provisioner "file" {
    source      = var.artifact_path
    destination = "/tmp/webapp-fork.zip"
  }

  # Install Node.js and dependencies
  provisioner "shell" {
    script = "../scripts/install_node.sh"
  }

  # Create the non-login user 'csye6225'
  provisioner "shell" {
    script = "../scripts/create_nonlogin_user.sh"
  }

  # Deploy the Node.js application
  provisioner "shell" {
    script = "../scripts/deploy_app.sh"
  }

  # Set up the systemd service for the web application
  provisioner "shell" {
    script = "../scripts/setup_systemd_service.sh"
  }

  # Remove Git history
  provisioner "shell" {
    script = "../scripts/git_removal.sh"
  }

  # -----------------------------
  # CloudWatch Agent Provisioning
  # -----------------------------
  # Copy the CloudWatch Agent configuration file into the instance.
  provisioner "file" {
    source      = "configs/amazon-cloudwatch-agent.json"
    destination = "/home/ubuntu/amazon-cloudwatch-agent.json"
  }

  # Run the external script to install and configure CloudWatch Agent
  provisioner "shell" {
    script = "../scripts/install_cloudwatch_agent.sh"
  }
}
