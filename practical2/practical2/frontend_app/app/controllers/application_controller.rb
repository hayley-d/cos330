class ApplicationController < ActionController::Base
  allow_browser versions: :modern

  BACKEND_BASE_URL = ENV['BACKEND_URL'] || "https://localhost:3800"
end
