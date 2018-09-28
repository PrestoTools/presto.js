class App
  def call(env)
    unless env['REQUEST_METHOD'] == 'POST'
      return [405,
        {'Content-Type' => 'text/plain', 'Access-Control-Allow-Origin' => '*'},
        ['Method Not Allowed']
      ]
    end

    begin
      req = Rack::Request.new(env)
      raise if req[:chunk].nil?
      saveChunk(req)

      return [200,
        {'Content-Type' => 'text/plain', 'Access-Control-Allow-Origin' => '*'},
        ['Success']
      ]
    rescue
      return [500,
        {'Content-Type' => 'text/plain', 'Access-Control-Allow-Origin' => '*'},
        ['Internal Server Error']
      ]
    end
  end

  def saveChunk(req)
    file_id = req[:prestoId]
    file_name = req[:name]
    file_size = req[:size].to_i
    chunk_index = req[:prestoChunkIndex]
    total_chunk_number = req[:totalChunkNumber].to_i

    save_dir = '../tmp'
    save_file_path = "#{save_dir}/part/#{file_id}part#{chunk_index}"

    Dir.mkdir(save_dir) unless Dir.exist?(save_dir)
    Dir.mkdir("#{save_dir}/part") unless Dir.exist?("#{save_dir}/part")

    File.open(save_file_path, 'wb'){ |f|
      f.write(req[:chunk][:tempfile].read)
    }

    if isLastChunk(total_chunk_number, save_dir, file_id)
      createFileFromChunks(save_dir, file_name, file_id, file_size)
    end
  end

  def isLastChunk(total_chunk_number, save_dir, file_id)
    part_file_count = 0;
    Dir.glob("#{save_dir}/part/#{file_id}*").each do |f|
      part_file_count += 1
    end

    part_file_count == total_chunk_number
  end

  def createFileFromChunks(save_dir, file_name, file_id, file_size)
    total_chunk_files = 0
    Dir.glob("#{save_dir}/part/#{file_id}*").each do |f|
      total_chunk_files += 1
    end

    save_file = File.open("#{save_dir}/#{file_name}", 'w')
    save_file.flock(File::LOCK_EX)
    (0..(total_chunk_files - 1)).each do |chunk_index|
      save_file.write(
        File.open("#{save_dir}/part/#{file_id}part#{chunk_index}").read
      )
    end
    save_file.close

    raise unless File.size("#{save_dir}/#{file_name}") == file_size

    Dir.glob("#{save_dir}/part/#{file_id}*").each do |f|
      File.delete(f)
    end

  end
end
