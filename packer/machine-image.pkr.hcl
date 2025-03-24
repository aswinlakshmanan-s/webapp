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
# AWS Builder - Ubuntu 24.04 (or update filter if needed)
# ---------------------------------------------------------------------
source "amazon-ebs" "ubuntu_node" {
  region                      = var.aws_region
  instance_type               = var.aws_machine_type
  subnet_id                   = var.aws_subnet_id
  associate_public_ip_address = true
  source_ami                  = var.aws_source_ami

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
# GCP Builder
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

  # Create the non-login user 'csye6225'.
  provisioner "shell" {
    script = "../scripts/create_nonlogin_user.sh"
  }

  # Deploy the Node.js application.
  provisioner "shell" {
    # environment_vars = [
    #   "DB_PASSWORD=${var.db_password}",
    #   "DB_NAME=${var.db_name}",
    #   "DB_USER=${var.db_user}",
    #   "DB_HOST=${var.db_host}",
    #   "DB_PORT=${var.db_port}",
    #   "DB_DIALECT=${var.db_dialect}",
    #   "PORT=${var.port}"
    # ]
    script = "../scripts/deploy_app.sh"
  }

  # Set up the systemd service.
  provisioner "shell" {
    script = "../scripts/setup_systemd_service.sh"
  }

  # Remove Git history (if needed).
  provisioner "shell" {
    script = "../scripts/git_removal.sh"
  }

    # Create log directory and set ownership to csye6225:csye6225.
  provisioner "shell" {
    script = "../scripts/create_log_directory.sh"
  }

  provisioner "file" {
    source      = "./configs/amazon-cloudwatch-agent.json"
    destination = "/home/ubuntu/amazon-cloudwatch-agent.json"
  }

  provisioner "shell" {
    script = "../scripts/install_cloudwatch_agent.sh"
  }
}