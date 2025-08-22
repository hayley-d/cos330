Rails.application.routes.draw do
  root "sessions#new"

  get "up" => "rails/health#show", as: :rails_health_check

  get    "/login",    to: "sessions#new"
  post   "/login",    to: "sessions#create"
  delete "/logout",   to: "sessions#destroy"

  get    "/register", to: "registrations#new"
  post   "/register", to: "registrations#create"
  #
  # get    "/otp",      to: "otp#new"
  # post   "/otp",      to: "otp#create"

  shallow do
    resources :roles
    resources :images
    resources :documents
  end



end
