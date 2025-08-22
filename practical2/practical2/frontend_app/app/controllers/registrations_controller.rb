# frozen_string_literal: true

class RegistrationsController < ApplicationController
  def new
  end

  def create
    # Here you would send the user data to your Node.js backend
    # For now, just fake success
    flash[:notice] = "Account created successfully!"
    redirect_to login_path
  end
end
