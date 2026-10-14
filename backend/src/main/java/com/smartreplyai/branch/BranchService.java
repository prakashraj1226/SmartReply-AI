package com.smartreplyai.branch;

import com.smartreplyai.branch.dto.BranchDto;
import com.smartreplyai.branch.dto.CreateBranchRequest;
import com.smartreplyai.branch.dto.UpdateBranchRequest;
import com.smartreplyai.business.Business;
import com.smartreplyai.business.BusinessRepository;
import com.smartreplyai.common.BadRequestException;
import com.smartreplyai.common.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class BranchService {

    private final BranchRepository branchRepository;
    private final BusinessRepository businessRepository;

    public BranchService(BranchRepository branchRepository, BusinessRepository businessRepository) {
        this.branchRepository = branchRepository;
        this.businessRepository = businessRepository;
    }

    @Transactional(readOnly = true)
    public List<BranchDto> getBranches(UUID businessId, Boolean activeOnly) {
        List<Branch> branches;
        if (activeOnly == null || activeOnly) {
            branches = branchRepository.findByBusinessIdAndIsActiveTrue(businessId);
        } else {
            branches = branchRepository.findByBusinessId(businessId);
        }
        return branches.stream().map(BranchDto::fromEntity).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BranchDto getBranchById(UUID businessId, UUID branchId) {
        Branch branch = branchRepository.findByBusinessIdAndId(businessId, branchId)
                .orElseThrow(() -> new ResourceNotFoundException("Branch not found with ID: " + branchId));
        return BranchDto.fromEntity(branch);
    }

    @Transactional
    public BranchDto createBranch(UUID businessId, CreateBranchRequest request) {
        Business business = businessRepository.findById(businessId)
                .orElseThrow(() -> new ResourceNotFoundException("Business not found with ID: " + businessId));

        if (branchRepository.existsByBusinessIdAndName(businessId, request.getName().trim())) {
            throw new BadRequestException("A branch with the name '" + request.getName().trim() + "' already exists");
        }

        Branch branch = new Branch(
                business,
                request.getName().trim(),
                request.getAddress() != null ? request.getAddress().trim() : null,
                request.getPhone() != null ? request.getPhone().trim() : null,
                request.getTimezone() != null && !request.getTimezone().isBlank() ? request.getTimezone().trim() : business.getTimezone()
        );

        branch = branchRepository.save(branch);
        return BranchDto.fromEntity(branch);
    }

    @Transactional
    public BranchDto updateBranch(UUID businessId, UUID branchId, UpdateBranchRequest request) {
        Branch branch = branchRepository.findByBusinessIdAndId(businessId, branchId)
                .orElseThrow(() -> new ResourceNotFoundException("Branch not found with ID: " + branchId));

        if (request.getName() != null && !request.getName().isBlank()) {
            String newName = request.getName().trim();
            if (!newName.equalsIgnoreCase(branch.getName()) && branchRepository.existsByBusinessIdAndName(businessId, newName)) {
                throw new BadRequestException("A branch with the name '" + newName + "' already exists");
            }
            branch.setName(newName);
        }

        if (request.getAddress() != null) {
            branch.setAddress(request.getAddress().trim());
        }
        if (request.getPhone() != null) {
            branch.setPhone(request.getPhone().trim());
        }
        if (request.getTimezone() != null && !request.getTimezone().isBlank()) {
            branch.setTimezone(request.getTimezone().trim());
        }
        if (request.getIsActive() != null) {
            branch.setActive(request.getIsActive());
        }

        branch = branchRepository.save(branch);
        return BranchDto.fromEntity(branch);
    }

    @Transactional
    public void deactivateBranch(UUID businessId, UUID branchId) {
        Branch branch = branchRepository.findByBusinessIdAndId(businessId, branchId)
                .orElseThrow(() -> new ResourceNotFoundException("Branch not found with ID: " + branchId));
        branch.setActive(false);
        branchRepository.save(branch);
    }
}
