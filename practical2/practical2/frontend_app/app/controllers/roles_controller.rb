# frozen_string_literal: true

class RolesController < ApplicationController
  def index
    conn = Faraday.new(url: "#{BACKEND_BASE_URL}", ssl: { verify: false })
    response = conn.get("/list") do |req|
      req.headers["Authorization"] = "Bearer #{session[:jwt]}"
    end

    if response.status == 200
      @users = JSON.parse(response.body)
    else
      flash[:alert] = "Failed to load users"
      @documents = []
    end
  end

  def approve_user
    conn = Faraday.new(url: "#{BACKEND_BASE_URL}", ssl: { verify: false })
    access_res = conn.get("/check_role") do |req|
      req.headers["Authorization"] = "Bearer #{session[:jwt]}"
    end

    if access_res.status != 200
      flash[:alert] = "You do not have permission to approve users."
      redirect_to roles_path and return
    end

    access_res = conn.patch("/approve", { user_id: params[:user_id] }.to_json,
                           "Authorization" => "Bearer #{session[:jwt]}",
                           "Content-Type" => "application/json"
    )

    if access_res.status != 200
      flash[:alert] = "Failed to approve user."
      redirect_to roles_path and return
    end

    redirect_to roles_path
  end

  def edit
    user_id = params[:id]

    conn = Faraday.new(url: "#{BACKEND_BASE_URL}", ssl: { verify: false })
    response = conn.get("/users/#{user_id}") do |req|
      req.headers["Authorization"] = "Bearer #{session[:jwt]}"
    end

    if response.status == 200
      @user = JSON.parse(response.body)
      @roles = ROLE_IDS
    else
      flash[:alert] = "Failed to load user"
      redirect_to roles_path
    end
  end


  def update
    conn = Faraday.new(BACKEND_BASE_URL, ssl: { verify: false })
    access_res = conn.get("/check_role") do |req|
      req.headers["Authorization"] = "Bearer #{session[:jwt]}"
    end

    if access_res.status != 200
      flash[:alert] = "You do not have permission to perform this action."
      redirect_to roles_path and return
    end

    user_id = params[:id]
    new_role_id = params[:role_id]

    if @user && @user["role_id"] == ROLE_IDS["Admin"] && new_role_id != ROLE_IDS["Admin"]
      flash[:alert] = "Admin role cannot be changed."
      redirect_to roles_path and return
    end

    response = conn.patch(
      "/update_role",
      { user_id: user_id, role_id: new_role_id }.to_json,
      "Authorization" => "Bearer #{session[:jwt]}",
      "Content-Type" => "application/json"
    )

    if response.status == 200
      flash[:notice] = "User role updated"
      redirect_to roles_path
    else
      flash[:alert] = "Failed to update user role"
      redirect_to roles_path
    end
  end

end
