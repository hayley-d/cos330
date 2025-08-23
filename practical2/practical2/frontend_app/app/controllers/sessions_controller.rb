# frozen_string_literal: true

class SessionsController < ApplicationController



  def new

  end

  def login
    conn = Faraday.new(url: BACKEND_BASE_URL, ssl: { verify: false })
    response = conn.post("#{BACKEND_BASE_URL}/login", {
      user_email: params[:email],
      password: params[:password]
    })

    body = JSON.parse(response.body)

    if body["mfa_required"]
      session[:pending_user] = body["user_id"]
      session[:pending_user_email] = body["user_email"]
      redirect_to otp_path
    else
      flash[:alert] = "Invalid login credentials"
      render :new, status: :unprocessable_entity
    end
  end

  def otp
    # Renders OTP form
  end

  def verify_otp
    conn = Faraday.new(url: BACKEND_BASE_URL, ssl: { verify: false })
    response = conn.post("#{BACKEND_BASE_URL}/verify", {
      user_email: session[:pending_user_email],
      current_ip: request.remote_ip,
      otp: params[:otp]
    })

    body = JSON.parse(response.body)

    if body["ok"]
      session[:jwt] = body["token"]
      flash[:notice] = "Logged in successfully"
      redirect_to home_path
    else
      flash[:alert] = "Invalid OTP"
      render :otp, status: :unprocessable_entity
    end
  end

  def new_register
    # render register form
  end

  def create_register
    conn = Faraday.new(url: BACKEND_BASE_URL, ssl: { verify: false })
    response = conn.post("#{BACKEND_BASE_URL}/register", {
      first_name: params[:first_name],
      last_name: params[:last_name],
      email: params[:email],
      password: params[:password]
    })

    body = JSON.parse(response.body)

    if body["user_email"] && body["url"]
      session[:pending_email] = body["user_email"]
      session[:mfa_url] = body["url"]
      redirect_to setup_mfa_path
    else
      flash[:alert] = "Registration failed"
      render :new_register, status: :unprocessable_entity
    end
  end

  def setup_mfa
    @mfa_url = session[:mfa_url]
  end

  def verify_mfa
    conn = Faraday.new(url: BACKEND_BASE_URL, ssl: { verify: false })
    response = conn.post("#{BACKEND_BASE_URL}/two_factor", {
      user_email: session[:pending_email],
      token: params[:otp]
    })

    if response.status == 200
      body = JSON.parse(response.body)
      session[:jwt] = body["token"]
      flash[:notice] = "Welcome! Your account is now verified."
      redirect_to home_path
    else
      flash[:alert] = "Invalid OTP"
      redirect_to otp_path
    end
  end

  def destroy
    reset_session
    redirect_to login_path
  end
end
