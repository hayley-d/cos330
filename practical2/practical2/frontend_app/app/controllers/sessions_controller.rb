# frozen_string_literal: true

class SessionsController < ApplicationController
  def new

  end

  def login
    response = Faraday.post("#{BACKEND_BASE_URL}/login", {
      user_email: params[:email],
      password: params[:password]
    })

    body = JSON.parse(response.body)

    if body["ok"]
      if body["requires_otp"]
        session[:pending_user] = body["user_email"]
        redirect_to otp_path
      end
    else
      flash[:alert] = "Invalid login credentials"
      render :new, status: :unprocessable_entity
    end
  end

  def register
    response = Faraday.post("#{BACKEND_BASE_URL}/login", {
      user_email: params[:email],
      password: params[:password]
    })

    body = JSON.parse(response.body)

    if body["ok"]
      if body["requires_otp"]
        session[:pending_user] = body["user_email"]
        redirect_to otp_path
      end
    else
      flash[:alert] = "Invalid login credentials"
      render :new, status: :unprocessable_entity
    end
  end

  def opt
    response = Faraday.post("#{BACKEND_BASE_URL}/login", {
      user_email: params[:email],
      password: params[:password]
    })

    body = JSON.parse(response.body)

    if body["ok"]
      if body["requires_otp"]
        session[:pending_user] = body["user_email"]
        redirect_to otp_path
      end
    else
      flash[:alert] = "Invalid login credentials"
      render :new, status: :unprocessable_entity
    end
  end

  def destory
    reset_session
    redirect_to login_path
  end
end
