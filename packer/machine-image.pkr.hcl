packer {
  required_version = ">= 1.8.0"
  required_plugins {
    amazon = {
      version = ">= 1.0.0"
      source  = "github.com/hashicorp/amazon"
    }
    googlecompute = {
      version = "~> 1.0.0"
      source  = "github.com/hashicorp/googlecompute"
    }
  }
}

# ---------------------------------------------------------------------
# AWS Variables
# ---------------------------------------------------------------------
variable "aws_region" {
  type    = string
  default = "us-east-2"
}

variable "aws_subnet_id" {
  type    = string
  default = "subnet-08fb0c96b79ae087d"  # Replace with your DEV VPC subnet ID
}

# ---------------------------------------------------------------------
# GCP Variables
# ---------------------------------------------------------------------
variable "gcp_project_id" {
  type    = string
  default = "inductive-album-451801-q5"
}

variable "gcp_zone" {
  type    = string
  default = "us-central1-a"
}

# ---------------------------------------------------------------------
# Common Variables
# ---------------------------------------------------------------------
variable "artifact_path" {
  type    = string
  default = "../webapp-fork.zip"  # The artifact built on CI
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
  default = "test"
}

variable "node_env" {
  type    = string
  default = "production"
}

# ---------------------------------------------------------------------
# AWS Builder - Using amazon-ebs
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
# GCP Builder - Using googlecompute
# ---------------------------------------------------------------------
source "googlecompute" "app_image" {
  project_id          = var.gcp_project_id
  source_image_family = "ubuntu-2404-lts"  # Ensure this family is available in your region
  zone                = var.gcp_zone
  ssh_username        = var.ssh_username
  image_name          = "csye6225-app-{{timestamp}}"
  image_family        = "csye6225-app"
  image_labels = {
    created-by = "packer"
  }
  # Optional: you can specify machine type, network, subnetwork if needed.
  machine_type = "e2-micro"
  network      = "default"
  subnetwork   = "default"
}

# ---------------------------------------------------------------------
# Build Block: Provisioning Steps (applied to both builders)
# ---------------------------------------------------------------------
build {
  name    = "custom-webapp-image"
  sources = [
    "source.amazon-ebs.ubuntu_node",
    "source.googlecompute.app_image"
  ]

  # Copy the application artifact into the instance.
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

  # Deploy the Node.js application (unzip artifact, install dependencies, set ownership, create .env file).
  provisioner "shell" {
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
      "NODE_ENV=${var.node_env}"
    ]
    script = "../scripts/configure_postgresql.sh"
  }

  # Set up the systemd service (copies service file and starts the app).
  provisioner "shell" {
    script = "../scripts/setup_systemd_service.sh"
  }
}
