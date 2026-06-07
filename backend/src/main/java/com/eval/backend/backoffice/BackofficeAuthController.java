package com.eval.backend.backoffice;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class BackofficeAuthController {

    private final String accessCode;

    public BackofficeAuthController(@Value("${backoffice.access-code:0000}") String accessCode) {
        this.accessCode = accessCode;
    }

    @PostMapping("/backoffice/auth/verify")
    public ResponseEntity<VerifyResponse> verify(@RequestBody VerifyRequest request) {
        String provided = request != null && request.code() != null ? request.code().trim() : "";
        boolean ok = !provided.isEmpty() && provided.equals(accessCode);
        return ok ? ResponseEntity.ok(new VerifyResponse(true)) : ResponseEntity.status(401).body(new VerifyResponse(false));
    }

    public record VerifyRequest(String code) {}

    public record VerifyResponse(boolean ok) {}
}

