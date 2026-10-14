package com.smartreplyai.servicecatalog;

import com.smartreplyai.branch.Branch;
import com.smartreplyai.branch.BranchRepository;
import com.smartreplyai.business.Business;
import com.smartreplyai.business.BusinessRepository;
import com.smartreplyai.common.ResourceNotFoundException;
import com.smartreplyai.servicecatalog.dto.CreateServiceItemRequest;
import com.smartreplyai.servicecatalog.dto.ServiceItemDto;
import com.smartreplyai.servicecatalog.dto.UpdateServiceItemRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ServiceCatalogService {

    private final ServiceItemRepository serviceItemRepository;
    private final BusinessRepository businessRepository;
    private final BranchRepository branchRepository;

    public ServiceCatalogService(ServiceItemRepository serviceItemRepository,
                                 BusinessRepository businessRepository,
                                 BranchRepository branchRepository) {
        this.serviceItemRepository = serviceItemRepository;
        this.businessRepository = businessRepository;
        this.branchRepository = branchRepository;
    }

    @Transactional(readOnly = true)
    public List<ServiceItemDto> getServices(UUID businessId, UUID branchId, String category, Boolean activeOnly) {
        List<ServiceItem> services;
        boolean onlyActive = activeOnly == null || activeOnly;

        if (branchId != null) {
            services = onlyActive
                    ? serviceItemRepository.findByBusinessIdAndBranchIdAndIsActiveTrue(businessId, branchId)
                    : serviceItemRepository.findByBusinessIdAndBranchId(businessId, branchId);
        } else if (category != null && !category.isBlank()) {
            services = onlyActive
                    ? serviceItemRepository.findByBusinessIdAndCategoryAndIsActiveTrue(businessId, category.trim())
                    : serviceItemRepository.findByBusinessIdAndCategory(businessId, category.trim());
        } else {
            services = onlyActive
                    ? serviceItemRepository.findByBusinessIdAndIsActiveTrue(businessId)
                    : serviceItemRepository.findByBusinessId(businessId);
        }

        return services.stream().map(ServiceItemDto::fromEntity).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ServiceItemDto getServiceById(UUID businessId, UUID serviceId) {
        ServiceItem item = serviceItemRepository.findByBusinessIdAndId(businessId, serviceId)
                .orElseThrow(() -> new ResourceNotFoundException("Service not found with ID: " + serviceId));
        return ServiceItemDto.fromEntity(item);
    }

    @Transactional(readOnly = true)
    public List<String> getCategories(UUID businessId) {
        return serviceItemRepository.findDistinctCategoriesByBusinessId(businessId);
    }

    @Transactional
    public ServiceItemDto createService(UUID businessId, CreateServiceItemRequest request) {
        Business business = businessRepository.findById(businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Business not found with ID: " + businessId));

        Branch branch = null;
        if (request.getBranchId() != null) {
            branch = branchRepository.findByBusinessIdAndId(businessId, request.getBranchId())
                    .orElseThrow(() -> new ResourceNotFoundException("Branch not found with ID: " + request.getBranchId()));
        }

        ServiceItem item = new ServiceItem();
        item.setBusiness(business);
        item.setBranch(branch);
        item.setName(request.getName().trim());
        item.setCategory(request.getCategory() != null ? request.getCategory().trim() : null);
        item.setDescription(request.getDescription() != null ? request.getDescription().trim() : null);
        item.setDurationMinutes(request.getDurationMinutes());
        item.setBufferBeforeMinutes(request.getBufferBeforeMinutes());
        item.setBufferAfterMinutes(request.getBufferAfterMinutes());
        item.setPrice(request.getPrice());
        item.setCurrency(request.getCurrency() != null ? request.getCurrency().trim().toUpperCase() : "INR");
        item.setActive(true);

        item = serviceItemRepository.save(item);
        return ServiceItemDto.fromEntity(item);
    }

    @Transactional
    public ServiceItemDto updateService(UUID businessId, UUID serviceId, UpdateServiceItemRequest request) {
        ServiceItem item = serviceItemRepository.findByBusinessIdAndId(businessId, serviceId)
                .orElseThrow(() -> new ResourceNotFoundException("Service not found with ID: " + serviceId));

        if (request.getBranchId() != null) {
            Branch branch = branchRepository.findByBusinessIdAndId(businessId, request.getBranchId())
                    .orElseThrow(() -> new ResourceNotFoundException("Branch not found with ID: " + request.getBranchId()));
            item.setBranch(branch);
        }

        if (request.getName() != null && !request.getName().isBlank()) {
            item.setName(request.getName().trim());
        }
        if (request.getCategory() != null) {
            item.setCategory(request.getCategory().trim());
        }
        if (request.getDescription() != null) {
            item.setDescription(request.getDescription().trim());
        }
        if (request.getDurationMinutes() != null) {
            item.setDurationMinutes(request.getDurationMinutes());
        }
        if (request.getBufferBeforeMinutes() != null) {
            item.setBufferBeforeMinutes(request.getBufferBeforeMinutes());
        }
        if (request.getBufferAfterMinutes() != null) {
            item.setBufferAfterMinutes(request.getBufferAfterMinutes());
        }
        if (request.getPrice() != null) {
            item.setPrice(request.getPrice());
        }
        if (request.getCurrency() != null && !request.getCurrency().isBlank()) {
            item.setCurrency(request.getCurrency().trim().toUpperCase());
        }
        if (request.getIsActive() != null) {
            item.setActive(request.getIsActive());
        }

        item = serviceItemRepository.save(item);
        return ServiceItemDto.fromEntity(item);
    }

    @Transactional
    public void deactivateService(UUID businessId, UUID serviceId) {
        ServiceItem item = serviceItemRepository.findByBusinessIdAndId(businessId, serviceId)
                .orElseThrow(() -> new ResourceNotFoundException("Service not found with ID: " + serviceId));
        item.setActive(false);
        serviceItemRepository.save(item);
    }
}
