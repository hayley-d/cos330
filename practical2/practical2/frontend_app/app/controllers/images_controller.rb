# frozen_string_literal: true

class ImagesController < ApplicationController

  def index
    conn = Faraday.new(url: "#{BACKEND_BASE_URL}/images", ssl: { verify: false })
    response = conn.get("/list") do |req|
      req.headers["Authorization"] = "Bearer #{session[:jwt]}"
    end

    if response.status == 200
      @images = JSON.parse(response.body)
    else
      flash[:alert] = "Failed to load images"
      @images = []
    end
  end

  def edit
    asset_id = params[:id]

    # check access
    conn = Faraday.new(url: "#{BACKEND_BASE_URL}", ssl: { verify: false })
    access_res = conn.post("/has_access", { permission: "update_image" }.to_json,
                           "Authorization" => "Bearer #{session[:jwt]}",
                           "Content-Type" => "application/json"
    )

    if access_res.status != 200
      flash[:alert] = "You do not have permission to edit this image."
      redirect_to images_path and return
    end

    conn = Faraday.new(url: "#{BACKEND_BASE_URL}/images", ssl: { verify: false })
    response = conn.get("/#{asset_id}") do |req|
      req.headers["Authorization"] = "Bearer #{session[:jwt]}"
    end

    if response.status == 200
      @image = JSON.parse(response.body)
    else
      flash[:alert] = "Failed to load image"
      redirect_to images_path
    end
  end


  def update
    conn = Faraday.new(url: "#{BACKEND_BASE_URL}/images", ssl: { verify: false })
    response = conn.patch("/", {
      asset_id: params[:id],
      file_name: params[:file_name],
      description: params[:description],
      updated_by: session[:user_id],
      mime_type: "png",
      asset_type: "image"
    }, { "Authorization" => "Bearer #{session[:jwt]}" })

    if response.status == 200
      flash[:notice] = "Image updated"
      redirect_to images_path
    else
      flash[:alert] = "Failed to update image"
      render :edit, status: :unprocessable_entity
    end
  end

  def download
    asset_id = params[:id]
    conn = Faraday.new(url: "#{BACKEND_BASE_URL}/images", ssl: { verify: false })
    response = conn.get("/#{asset_id}") do |req|
      req.headers["Authorization"] = "Bearer #{session[:jwt]}"
    end

    if response.status == 200
      data = JSON.parse(response.body)
      send_data(Base64.decode64(data["bytes"]),
                filename: data["file_name"],
                type: data["mimeType"])
    else
      flash[:alert] = "You do not have access to download this image."
      redirect_to images_path
    end
  end

  def new
    # access check
    conn = Faraday.new(url: "#{BACKEND_BASE_URL}/roles", ssl: { verify: false })
    access_res = conn.post("/has_access", { permission: "create_image" }.to_json,
                           "Authorization" => "Bearer #{session[:jwt]}",
                           "Content-Type" => "application/json"
    )

    if access_res.status != 200
      flash[:alert] = "You do not have permission to create images."
      redirect_to images_path
      return
    end
  end

  def create
    file = params[:file]
    conn = Faraday.new(url: "#{BACKEND_BASE_URL}", ssl: { verify: false })
    response = conn.post("/images/", {
      file_name: params[:file_name],
      description: params[:description],
      created_by: session[:pending_user],
      content: Base64.encode64(file.read),
      mime_type: normalize_mime_type(file),
      asset_type: "image"
    }, { "Authorization" => "Bearer #{session[:jwt]}" })

    if response.status == 201
      flash[:notice] = "Image created"
      redirect_to images_path
    else
      flash[:alert] = "Failed to create image"
      render :new, status: :unprocessable_entity
    end
  end

  private
    def normalize_mime_type(file)
      return nil unless file&.content_type
      file.content_type.split("/").last
    end

end

