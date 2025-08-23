Rails.application.routes.draw do
  root "sessions#new"

  get "up" => "rails/health#show", as: :rails_health_check

  get    "/login",    to: "sessions#new"
  post   "/login",    to: "sessions#login"
  delete "/logout",   to: "sessions#destroy"

  get "register", to: "sessions#new_register"
  post "register", to: "sessions#create_register"

  get "setup_mfa", to: "sessions#setup_mfa"
  post "setup_mfa", to: "sessions#verify_mfa"

  get "otp", to: "sessions#otp"
  post "otp", to: "sessions#verify_otp"

  delete "logout", to: "sessions#destroy"

  get "home", to: "home#index"

  shallow do
    resources :roles
    resources :images do
      member do
        get :download
      end
    end
    resources :confidential
    resources :documents, only: [ :index, :new, :create, :edit, :update ] do
      member do
        get :download
      end
    end

  end



end
