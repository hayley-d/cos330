require 'sqlite3'
require 'open3'
require 'colorize'
require 'json'

def extract_hashes(algorithm)
  db = SQLite3::Database.open("utils/users_realistic.db")
  db.results_as_hash = true

  File.open("hashes/#{algorithm}_hashes.txt", "w") do |file|
    db.execute("SELECT id, #{algorithm}_hash FROM users WHERE #{algorithm}_hash IS NOT NULL ") do |row|
      if algorithm == "md5"
        hash = "user#{row['id']}:$dynamic_0$#{row['md5_hash']}"
      else
        hash = "user#{row['id']}:#{row['sha256_hash']}"
      end
      file.puts hash.strip if hash
    end
  end

  db.close
  puts "Exported #{algorithm} hash to external file."
end

def run_john(algorithm, format,word_list_name)
  input_file = "hashes/#{algorithm}_hashes.txt"
  output_file = "hashes/#{algorithm}_cracked.txt"
  word_list = "utils/#{word_list_name}"

  puts "Running John on #{algorithm.upcase} using #{word_list_name}"

  start_time = Time.now
  command = "john --format #{format} #{input_file} --wordlist=#{word_list}"
  stdout, stderr, status = Open3.capture3(command)
  duration = Time.now - start_time

  show_command = "john --show --format=#{format} #{input_file}"
  cracked, _, _ = Open3.capture3(show_command)

  File.write(output_file, cracked)
  cracked_lines = cracked.lines.reject { |line| line.strip.empty? || line.include?(':') == false }

  puts "Cracked #{cracked_lines.count} #{algorithm.upcase} hashes in #{duration.round(2)} seconds."

  avg_per_hash = cracked_lines.count > 0 ? (duration / cracked_lines.count).round(2) : "N/A"

  result = { algorithm: algorithm, count: cracked_lines.count, time: duration, avg_per_hash: avg_per_hash,results: cracked_lines }

  result_file = "hashes/#{algorithm}_results.json"
  File.write(result_file, JSON.dump(result))
end

def print_results(result, algorithm)
  if algorithm == "md5"
    puts "#{algorithm.upcase} Results:".blue
    puts "Cracked:\t#{result[:count]}".blue
    puts "Time:\t#{result[:time].round(4)}".blue
    puts "Average/hash:\t#{result[:avg_per_hash]}".blue
    puts "Sample Output:\t#{result[:results].first(5).map(&:strip)}".blue
  else
    puts "#{algorithm.upcase} Results:".red
    puts "Cracked:\t#{result[:count]}".red
    puts "Time:\t#{result[:time].round(4)}".red
    puts "Average/hash:\t#{result[:avg_per_hash]}".red
    puts "Sample Output:\t#{result[:results].first(5).map(&:strip)}".red
  end
end

extract_hashes("md5")
extract_hashes("sha256")

pids = []

pids << Process.fork do
  md5_results = run_john("md5", "raw-md5", "rockyou.txt")
end

pids << Process.fork do
  sha_results = run_john("sha256", "raw-SHA256", "rockyou.txt")
end

pids.each { |pid| Process.wait(pid) }
puts "All jobs complete."

%w[md5 sha256].each do |algorithm|
  result_file = "hashes/#{algorithm}_results.json"

  if File.exist? result_file
    result = JSON.parse(File.read(result_file))
    result = result.transform_keys(&:to_sym)
    if algorithm == "md5"
      print_results(result, algorithm)
    else
      print_results(result, algorithm)
    end
  else
    puts "#{algorithm.upcase} result file not found.".yellow
   end
end

pids = []

pids << Process.fork do
  md5_results = run_john("md5", "raw-md5", "darkweb2017_top-10000.txt")
end

pids << Process.fork do
  sha_results = run_john("sha256", "raw-SHA256", "darkweb2017_top-10000.txt")
end

pids.each { |pid| Process.wait(pid) }
puts "All jobs complete."

%w[md5 sha256].each do |algorithm|
  result_file = "hashes/#{algorithm}_results.json"

  if File.exist? result_file
    result = JSON.parse(File.read(result_file))
    result = result.transform_keys(&:to_sym)
    if algorithm == "md5"
      print_results(result, algorithm)
    else
      print_results(result, algorithm)
    end
  else
    puts "#{algorithm.upcase} result file not found.".yellow
  end
end

pids = []

pids << Process.fork do
  md5_results = run_john("md5", "raw-md5", "scraped-JWT-secrets.txt")
end

pids << Process.fork do
  sha_results = run_john("sha256", "raw-SHA256", "scraped-JWT-secrets.txt")
end

pids.each { |pid| Process.wait(pid) }
puts "All jobs complete."

%w[md5 sha256].each do |algorithm|
  result_file = "hashes/#{algorithm}_results.json"

  if File.exist? result_file
    result = JSON.parse(File.read(result_file))
    result = result.transform_keys(&:to_sym)
    if algorithm == "md5"
      print_results(result, algorithm)
    else
      print_results(result, algorithm)
    end
  else
    puts "#{algorithm.upcase} result file not found.".yellow
  end
end
