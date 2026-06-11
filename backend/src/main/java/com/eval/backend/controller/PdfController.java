package com.eval.backend.controller;

import com.eval.backend.service.PdfService;
import com.eval.backend.service.TicketStatusHistoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pdf")
@CrossOrigin(origins = "*")
public class PdfController {

    @Autowired
    private PdfService pdfService;

    @Autowired
    private TicketStatusHistoryService historyService;

    @PostMapping("/ticket")
    public ResponseEntity<byte[]> generateTicketPdf(@RequestBody Map<String, Object> request) throws Exception {
        Map<String, Object> ticket = (Map<String, Object>) request.get("ticket");
        List<Map<String, Object>> history = (List<Map<String, Object>>) request.get("history");
        
        byte[] pdfBytes = pdfService.generateTicketPdf(ticket, history);

        String filename = "ticket_" + (ticket.get("id") != null ? ticket.get("id") : "unknown") + ".pdf";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", filename);

        return ResponseEntity.ok()
                .headers(headers)
                .body(pdfBytes);
    }

    @PostMapping("/elements")
    public ResponseEntity<byte[]> generateElementListPdf(@RequestBody Map<String, Object> request) throws Exception {
        List<Map<String, Object>> elements = (List<Map<String, Object>>) request.get("elements");
        String title = (String) request.get("title");
        
        byte[] pdfBytes = pdfService.generateElementListPdf(elements, title);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "liste_actifs.pdf");

        return ResponseEntity.ok()
                .headers(headers)
                .body(pdfBytes);
    }
}
