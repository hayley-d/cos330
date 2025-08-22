class ApplicationController < ActionController::Base
  allow_browser versions: :modern

  BACKEND_BASE_URL = "https://localhost:3000"
end
