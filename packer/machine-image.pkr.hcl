packer {
  required_version = ">= 1.8.0"
  required_plugins {
    amazon = {
      version = ">= 1.0.0"
      source  = "github.com/hashicorp/amazon"
    }
  }
}

# ---------------------------------------------------------------------
# Variables
# ---------------------------------------------------------------------
variable "aws_region" {
  type    = string
  default = "us-east-2"
}

variable "aws_subnet_id" {
  type    = string
  default = "subnet-08fb0c96b79ae087d"  # Replace with your DEV VPC subnet ID
}

variable "artifact_path" {
  type    = string
  default = "webapp-fork.zip"  # This is the artifact ZIP containing your Node.js app
}

variable "ssh_username" {
  type    = string
  default = "ubuntu"
}

# ---------------------------------------------------------------------
# AWS Builder - Ubuntu 24.04
# ---------------------------------------------------------------------
source "amazon-ebs" "ubuntu_node" {
  region                      = var.aws_region
  instance_type               = "t2.micro"
  subnet_id                   = var.aws_subnet_id
  associate_public_ip_address = true

  # AMI filter for Ubuntu 24.04 LTS (update the filter if needed)
  source_ami_filter {
    filters = {
      name                = "ubuntu/images/hvm-ssd/ubuntu-lunar-24.04-amd64-server-*"
      virtualization-type = "hvm"
    }
    owners      = ["099720109477"]  # Canonical's account ID
    most_recent = true
  }

  ssh_username = var.ssh_username
  ami_name     = "ubuntu-24-node-{{timestamp}}"

  launch_block_device_mappings {
    device_name           = "/dev/sda1"
    volume_size           = 10
    volume_type           = "gp2"
    delete_on_termination = true
  }
}

# ---------------------------------------------------------------------
# Build Block: Provisioning Steps
# ---------------------------------------------------------------------
build {
  name    = "ubuntu-24-node"
  sources = ["source.amazon-ebs.ubuntu_node"]

  # Copy the Node.js artifact from local to the build instance
  provisioner "file" {
    source      = var.artifact_path
    destination = "/tmp/webapp.zip"
  }

  # 1. Install Node.js (runs scripts/install_node.sh)
  provisioner "shell" {
    script = "scripts/install_node.sh"
  }

  # 2. Install PostgreSQL (runs scripts/install_postgresql.sh)
  provisioner "shell" {
    script = "scripts/install_postgresql.sh"
  }

  # 3. Create the non-login user (runs scripts/create_nonlogin_user.sh)
  provisioner "shell" {
    script = "scripts/create_nonlogin_user.sh"
  }

  # 4. Deploy the Node.js application (runs scripts/deploy_app.sh)
  provisioner "shell" {
    script = "scripts/deploy_app.sh"
  }

  # 5. Set up the systemd service (runs scripts/setup_systemd_service.sh)
  provisioner "shell" {
    script = "scripts/setup_systemd_service.sh"
  }
}
