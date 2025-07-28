require 'rubygems'
require 'bcrypt'
require 'openssl'
require 'base64'
require 'securerandom'

PEPPER = ENV['PEPPER'] || "supersecretpepper"

def encrypt_salt(salt, key)
  cipher = OpenSSL::Cipher.new('AES-256-CBC')
  cipher.encrypt
  cipher.key = key
  iv = cipher.random_iv
  cipher.iv = iv
  encrypted = cipher.update(salt) + cipher.final
  Base64.encode64(iv + encrypted)
end

def decrypt_salt(encrypted_salt_b64, key)
  encrypted_salt = Base64.decode64(encrypted_salt_b64)
  cipher = OpenSSL::Cipher.new('AES-256-CBC')
  cipher.decrypt
  cipher.key = key
  cipher.iv = encrypted_salt[0...16]
  cipher.update(encrypted_salt[16..]) + cipher.final
end

def register_user(plain_password, aes_key)
  salt = SecureRandom.hex(8)
  encrypted_salt = encrypt_salt(salt, aes_key)
  full_password = plain_password + salt + PEPPER
  hashed_password = BCrypt::Password.create(full_password)

  {
    encrypted_salt: encrypted_salt,
    hashed_password: hashed_password.to_s
  }
end

def verify_login(input_password, user_record, aes_key)
  salt = decrypt_salt(user_record[:encrypted_salt], aes_key)
  full_password = input_password + salt + PEPPER
  hashed = BCrypt::Password.new(user_record[:hashed_password])
  hashed == full_password
end


aes_key = Digest::SHA256.digest("secret_aes_password")
user_record = register_user("mySecurePass123", aes_key)

puts "Login attempt with correct password:"
puts verify_login("mySecurePass123", user_record, aes_key) ? " Success" : "Failure"

puts "\nLogin attempt with wrong password:"
puts verify_login("wrongPassword", user_record, aes_key) ? "Success" : "Failure"
