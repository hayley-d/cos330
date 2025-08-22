# frozen_string_literal: true

class DocumentsController < ApplicationController
  require "faraday"
  require "json"

  def index
    response = Faraday.get("#{BACKEND_BASE_URL}/documents")
    if response.success?
      @documents = JSON.parse(response.body)
    else
      @documents = []
      flash[:alert] = "Failed to load documents"
    end
  end

  def new

  end

  def create
    payload = {
      name: params[:name],
      description: params[:description]
    }

    response = Faraday.post("#{BACKEND_BASE_URL}/documents", payload)

    if response.success?
      redirect_to documents_path, notice: "Document created!"
    else
      flash[:alert] = "Failed to create document"
      render :new
    end
  end

  def edit
    response = Faraday.get("#{BACKEND_BASE_URL}/documents/#{params[:id]}")
    @document = response.success? ? JSON.parse(response.body) : {}
  end

  def update
    payload = {
      name: params[:name],
      description: params[:description]
    }

    response = Faraday.put("#{BACKEND_BASE_URL}/documents/#{params[:id]}", payload)

    if response.success?
      redirect_to documents_path, notice: "Document updated!"
    else
      flash[:alert] = "Failed to update document"
      render :edit
    end
  end

  def download
    response = Faraday.get("#{BACKEND_BASE_URL}/documents/#{params[:id]}/download")

    if response.success?
      send_data response.body,
                filename: response.headers["content-disposition"] || "document-#{params[:id]}",
                type: response.headers["content-type"] || "application/octet-stream"
    else
      redirect_to documents_path, alert: "Failed to download document"
    end
  end
end
