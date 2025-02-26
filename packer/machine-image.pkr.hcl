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

variable "aws_machine_type" {
  type    = string
  default = "t2.micro"
}

variable "aws_ami_filter_name" {
  type    = string
  default = "ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"
}

variable "ami_virtualization_type" {
  type    = string
  default = "hvm"
}

variable "ami_image_name" {
  type    = string
  default = "ubuntu-24-node-{{timestamp}}"
}

variable "aws_device_name" {
  type    = string
  default = "/dev/sda1"
}

variable "aws_volume" {
  type    = number
  default = 25
}

variable "aws_volume_type" {
  type    = string
  default = "gp2"
}

variable "artifact_path" {
  type    = string
  default = "" # The artifact will be built in CI and placed here
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

variable "db_user" {
  type    = string
  default = "test" # or your default value if desired
}

variable "db_host" {
  type    = string
  default = "localhost"
}

variable "db_port" {
  type    = number
  default = 5432
}

variable "db_dialect" {
  type    = string
  default = "postgres"
}

variable "port" {
  type    = number
  default = 8000
}

variable "gcp_project_id" {
  type    = string
  default = "inductive-album-451801-q5"
}

variable "gcp_zone" {
  type    = string
  default = "us-central1-a"
}

variable "gcp_raw_image" {
  type    = string
  default = "ubuntu-2404-lts-amd64"
}
variable "gcp_custom_image" {
  type    = string
  default = "csye6225-img-{{timestamp}}"
}
variable "gcp_image_family" {
  type    = string
  default = "csye6225-img"
}
variable "gcp_machine_type" {
  type    = string
  default = "e2-micro"
}
# ---------------------------------------------------------------------
# AWS Builder - Ubuntu 24.04 (or update filter if needed)
# ---------------------------------------------------------------------
source "amazon-ebs" "ubuntu_node" {
  region                      = var.aws_region
  instance_type               = var.aws_machine_type
  subnet_id                   = var.aws_subnet_id
  associate_public_ip_address = true

  source_ami_filter {
    filters = {
      name                = var.aws_ami_filter_name
      virtualization-type = var.ami_virtualization_type
    }
    owners      = ["099720109477"]
    most_recent = true
  }

  ssh_username = var.ssh_username
  ami_name     = var.ami_image_name

  launch_block_device_mappings {
    device_name           = var.aws_device_name
    volume_size           = var.aws_volume
    volume_type           = var.aws_volume_type
    delete_on_termination = true
  }
}

# -----------------------
# GCP 
# -----------------------
source "googlecompute" "compute_app_image" {
  project_id          = var.gcp_project_id
  source_image_family = var.gcp_raw_image
  zone                = var.gcp_zone
  ssh_username        = var.ssh_username
  image_name          = var.gcp_custom_image
  image_family        = var.gcp_image_family
  image_labels = {
    created-by = "packer"
  }
  # Optional settings
  machine_type = var.gcp_machine_type
  network      = "default"
  subnetwork   = "default"
}
# ---------------------------------------------------------------------
# Build Block: Provisioning Steps
# ---------------------------------------------------------------------
build {
  name = "ubuntu-24-node"
  sources = [
    "source.amazon-ebs.ubuntu_node",
    "source.googlecompute.compute_app_image"
  ]

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
    environment_vars = [
      "DB_PASSWORD=${var.db_password}",
      "DB_NAME=${var.db_name}",
      "DB_USER=${var.db_user}",
      "DB_HOST=${var.db_host}",
      "DB_PORT=${var.db_port}",
      "DB_DIALECT=${var.db_dialect}",
      "PORT=${var.port}"
    ]
    script = "../scripts/deploy_app.sh"
  }


  # Configure PostgreSQL database (using DB secrets).
  provisioner "shell" {
    environment_vars = [
      "DB_HOST=localhost",
      "DB_PORT=5432",
      "DB_NAME=${var.db_name}",
      "DB_USER=${var.db_user}",
      "DB_PASSWORD=${var.db_password}",
      "DB_DIALECT=postgres",
      "NODE_ENV=production"
    ]
    script = "../scripts/configure_postgresql.sh"
  }

  # Set up the systemd service (copies our service file and starts the app).
  provisioner "shell" {
    script = "../scripts/setup_systemd_service.sh"
  }
}
