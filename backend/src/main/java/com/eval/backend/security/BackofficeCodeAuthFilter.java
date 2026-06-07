package com.eval.backend.security;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

public class BackofficeCodeAuthFilter extends OncePerRequestFilter {

    private final String accessCode;

    public BackofficeCodeAuthFilter(String accessCode) {
        this.accessCode = accessCode;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        if (path == null) return true;
        if (path.equals("/backoffice/auth/verify")) return true;
        if (path.equals("/error")) return true;
        return HttpMethod.OPTIONS.matches(request.getMethod());
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String provided = request.getHeader("X-Backoffice-Code");
        provided = provided != null ? provided.trim() : "";

        if (!provided.isEmpty() && provided.equals(accessCode)) {
            var auth = new UsernamePasswordAuthenticationToken(
                    "backoffice",
                    null,
                    List.of(new SimpleGrantedAuthority("ROLE_BACKOFFICE"))
            );
            SecurityContextHolder.getContext().setAuthentication(auth);
            filterChain.doFilter(request, response);
            return;
        }

        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setContentType("application/json");
        response.getWriter().write("{\"error\":\"unauthorized\"}");
    }
}

