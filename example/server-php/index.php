<?php
	$_POST = filter_input_array(INPUT_POST, FILTER_SANITIZE_STRING);

	if (empty($_FILES)) {
		header($_SERVER['SERVER_PROTOCOL'] . ' 500 Internal Server Error', true, 500);
		die();
	}
	foreach ($_FILES as $file) {
		if ($file['error'] !== 0) {
			header($_SERVER['SERVER_PROTOCOL'] . ' 500 Internal Server Error', true, 500);
			die();
		}

		$file_id = $_POST['prestoId'];
		$file_name = $_POST['name'];
		$file_size = intval($_POST['size']);

		$save_dir = '../tmp';
		$save_file_path = $save_dir.'/part/'.$file_id.'.part'.$_POST['prestoChunkIndex'];
		if (!is_dir($save_dir)) {
			mkdir($save_dir, 0777, true);
		}
		if (is_dir($save_dir) && !is_dir($save_dir.'/part')) {
			mkdir($save_dir.'/part', 0777, true);
		}

		if (move_uploaded_file($file['tmp_name'], $save_file_path)) {
			$total_chunk_number = intval($_POST['totalChunkNumber']);
			$part_file_count = 0;
			foreach(scandir($save_dir.'/part') as $part_file) {
				if (stripos($part_file, $file_id) !== false) {
					$part_file_count++;
				}
			}
			if ($part_file_count < $total_chunk_number) {
				header($_SERVER['SERVER_PROTOCOL'] . ' 200 OK', true, 200);
				die();
			}

			createFileFromChunks($save_dir, $file_name, $file_id, $file_size);
			header($_SERVER['SERVER_PROTOCOL'] . ' 200 OK', true, 200);

			die();
		} else {
			header($_SERVER['SERVER_PROTOCOL'] . ' 500 Internal Server Error', true, 500);
			die();
		}
	}

	function createFileFromChunks($save_dir, $file_name, $file_id, $file_size) {
		$total_files = 0;
		foreach(scandir($save_dir.'/part') as $file) {
			if (stripos($file, $file_id) !== false) {
				$total_files++;
			}
		}

		$fp = fopen($save_dir.'/'.$file_name, 'w');
		if ($fp === false) {
			header($_SERVER['SERVER_PROTOCOL'] . ' 500 Internal Server Error', true, 500);
			die();
		}

		$delete_file_list = array();
		for ($i = 0; $i < $total_files; $i++) {
			$part_file = $save_dir.'/part/'.$file_id.'.part'.$i;
			fwrite($fp, file_get_contents($part_file));
			array_push($delete_file_list, $part_file);
		}
		fclose($fp);

		checkFileSize($save_dir, $file_name, $file_size);
		deletePartFiles($delete_file_list);
	}

	function checkFileSize($save_dir, $file_name, $file_size) {
		if (filesize($save_dir.'/'.$file_name) !== $file_size) {
			header($_SERVER['SERVER_PROTOCOL'] . ' 500 Internal Server Error', true, 500);
			die();
		}
	}

	function deletePartFiles($delete_file_list) {
		foreach($delete_file_list as $delete_file) {
			if (file_exists($delete_file)) {
				@unlink($delete_file);
			}
		}
	}
