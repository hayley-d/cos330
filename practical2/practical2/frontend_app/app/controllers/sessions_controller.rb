# frozen_string_literal: true

class SessionsController < ApplicationController



  def new

  end

  def login
    conn = Faraday.new(url: BACKEND_BASE_URL, ssl: { verify: false })
    response = conn.post("#{BACKEND_BASE_URL}/login", {
      email: params[:email],
      password: params[:password]
    })

    body = JSON.parse(response.body)

    if body["mfa_required"]
      session[:pending_user] = body["user_id"]
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
      user_id: session[:pending_user],
      otp: params[:otp]
    })

    body = JSON.parse(response.body)

    if body["ok"]
      session[:jwt] = body["token"]
      flash[:notice] = "Logged in successfully"
      redirect_to documents_path
    else
      flash[:alert] = "Invalid OTP"
      render :otp, status: :unprocessable_entity
    end
  end

  def register
    conn = Faraday.new(url: BACKEND_BASE_URL, ssl: { verify: false })
    response = conn.post("#{BACKEND_BASE_URL}/login", {
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
    conn = Faraday.new(url: BACKEND_BASE_URL, ssl: { verify: false })
    response = conn.post("#{BACKEND_BASE_URL}/login", {
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

    body = JSON.parse(response.body)

    if response.status == 200
      flash[:notice] = "MFA setup complete. Please login."
      redirect_to login_path
    else
      flash[:alert] = body["error"] || "Invalid OTP"
      redirect_to setup_mfa_path
    end
  end

  def destroy
    reset_session
    redirect_to login_path
  end
end
