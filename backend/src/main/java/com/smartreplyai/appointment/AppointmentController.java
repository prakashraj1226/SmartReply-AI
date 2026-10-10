package com.smartreplyai.appointment;

import com.smartreplyai.appointment.dto.AppointmentDto;
import com.smartreplyai.appointment.dto.CreateAppointmentRequest;
import com.smartreplyai.appointment.dto.UpdateAppointmentRequest;
import com.smartreplyai.common.ApiResponse;
import com.smartreplyai.common.BadRequestException;
import com.smartreplyai.tenant.TenantContext;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;

    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<AppointmentDto>>> getAppointments(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "20") int size) {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) throw new BadRequestException("Active business tenant required");

        Page<AppointmentDto> appointments = appointmentService.getAppointments(businessId, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.ok(appointments));
    }

    @GetMapping("/calendar")
    public ResponseEntity<ApiResponse<List<AppointmentDto>>> getAppointmentsCalendar(
            @RequestParam(name = "start") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant start,
            @RequestParam(name = "end") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant end) {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) throw new BadRequestException("Active business tenant required");

        List<AppointmentDto> appointments = appointmentService.getAppointmentsByRange(businessId, start, end);
        return ResponseEntity.ok(ApiResponse.ok(appointments));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AppointmentDto>> getAppointmentById(@PathVariable("id") UUID id) {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) throw new BadRequestException("Active business tenant required");

        AppointmentDto dto = appointmentService.getAppointmentById(businessId, id);
        return ResponseEntity.ok(ApiResponse.ok(dto));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AppointmentDto>> createAppointment(
            @Valid @RequestBody CreateAppointmentRequest req) {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) throw new BadRequestException("Active business tenant required");

        AppointmentDto dto = appointmentService.createAppointment(businessId, req);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Appointment booked successfully", dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AppointmentDto>> updateAppointment(
            @PathVariable("id") UUID id,
            @Valid @RequestBody UpdateAppointmentRequest req) {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) throw new BadRequestException("Active business tenant required");

        AppointmentDto dto = appointmentService.updateAppointment(businessId, id, req);
        return ResponseEntity.ok(ApiResponse.ok("Appointment updated successfully", dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> cancelAppointment(@PathVariable("id") UUID id) {
        UUID businessId = TenantContext.getBusinessId();
        if (businessId == null) throw new BadRequestException("Active business tenant required");

        appointmentService.cancelAppointment(businessId, id);
        return ResponseEntity.ok(ApiResponse.ok("Appointment cancelled", null));
    }
}
