# frozen_string_literal: true

class HomeController < ApplicationController
  def index

  end

  def require_login
    unless session[:jwt]
      flash[:alert] = "Please log in first"
      redirect_to login_path
    end
  end
end
