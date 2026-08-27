package com.verifyle.app.service;

import com.verifyle.app.exception.FileStorageException;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

/**
 * Handles file upload/download operations on the local filesystem.
 * Validates file type (PDF/JPG/JPEG/PNG) and size (max 5MB).
 */
@Service
public class FileStorageService {

    @Value("${app.file.upload-dir}")
    private String uploadDir;

    private Path fileStoragePath;

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "application/pdf",
            "image/jpeg",
            "image/jpg",
            "image/png"
    );

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "pdf", "jpg", "jpeg", "png"
    );

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

    @PostConstruct
    public void init() {
        this.fileStoragePath = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.fileStoragePath);
        } catch (IOException e) {
            throw new FileStorageException("Could not create upload directory", e);
        }
    }

    /**
     * Stores a file on the filesystem after validation.
     * @return the unique stored filename
     */
    public String storeFile(MultipartFile file) {
        // Validate file is not empty
        if (file.isEmpty()) {
            throw new FileStorageException("Cannot upload an empty file");
        }

        // Validate file size
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new FileStorageException("File size exceeds maximum allowed size of 5MB");
        }

        // Validate content type
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new FileStorageException("Only PDF, JPG, JPEG, and PNG files are allowed");
        }

        // Validate file extension
        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());
        String extension = getFileExtension(originalFilename).toLowerCase();
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new FileStorageException("Only PDF, JPG, JPEG, and PNG files are allowed");
        }

        // Generate unique filename
        String storedFileName = UUID.randomUUID().toString() + "." + extension;

        try {
            Path targetLocation = this.fileStoragePath.resolve(storedFileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            return storedFileName;
        } catch (IOException e) {
            throw new FileStorageException("Could not store file " + originalFilename, e);
        }
    }

    /**
     * Loads a file as a Spring Resource for download.
     */
    public Resource loadFileAsResource(String storedFileName) {
        try {
            Path filePath = this.fileStoragePath.resolve(storedFileName).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new FileStorageException("File not found: " + storedFileName);
            }
        } catch (MalformedURLException e) {
            throw new FileStorageException("File not found: " + storedFileName, e);
        }
    }

    public String getFilePath(String storedFileName) {
        return this.fileStoragePath.resolve(storedFileName).toString();
    }

    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf(".") + 1);
    }
}
