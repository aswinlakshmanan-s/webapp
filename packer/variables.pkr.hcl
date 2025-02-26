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

variable "aws_ami_owners" {
  type    = list(string)
  default = ["099720109477"]
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
  default = "test"
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
