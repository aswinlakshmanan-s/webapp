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
  default = "subnet-08fb0c96b79ae087d" # Replace with your DEV VPC subnet ID
}

variable "artifact_path" {
  type    = string
  default = "../webapp-fork.zip" # The artifact will be built in CI and placed here
}

variable "ssh_username" {
  type    = string
  default = "ubuntu"
}

variable "db_password" {
  type    = string
  default = ""
}

variable "db_name" {
  type    = string
  default = ""
}

# ---------------------------------------------------------------------
# AWS Builder - Ubuntu 24.04 (or update filter if needed)
# ---------------------------------------------------------------------
source "amazon-ebs" "ubuntu_node" {
  region                      = var.aws_region
  instance_type               = "t2.micro"
  subnet_id                   = var.aws_subnet_id
  associate_public_ip_address = true

  source_ami_filter {
  filters = {
    name                = "ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"
    virtualization-type = "hvm"
  }
  owners      = ["099720109477"]
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

  # Copy the artifact (the webapp ZIP) into the instance.
  provisioner "file" {
    source      = var.artifact_path
    destination = "/tmp/webapp-fork.zip"
  }

  # Install Node.js and dependencies.
  provisioner "shell" {
    script = "../scripts/install_node.sh"
  }

  # Install PostgreSQL.
  provisioner "shell" {
    script = "../scripts/install_postgresql.sh"
  }

  # Create the non-login user 'csye6225'.
  provisioner "shell" {
    script = "../scripts/create_nonlogin_user.sh"
  }

  # Deploy the Node.js application (unzip artifact, install dependencies, set ownership).
  provisioner "shell" {
    script = "../scripts/deploy_app.sh"
  }

  # Configure PostgreSQL database (using DB secrets).
  provisioner "shell" {
    environment_vars = [
      "DB_PASSWORD=${var.db_password}",
      "DB_NAME=${var.db_name}"
    ]
    script = "../scripts/configure_postgresql.sh"
  }

  # Set up the systemd service (copies our service file and starts the app).
  provisioner "shell" {
    script = "../scripts/setup_systemd_service.sh"
  }
}


