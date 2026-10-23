import { Employee, Branch } from '../types';

/**
 * Xodim montajchi usta sifatida tanlanishi mumkinmi?
 * Qoidalar:
 * 1. Admin (emp-admin, systemRole === 'admin', role includes 'admin') hechnaqachon usta sifatida chiqmaydi.
 * 2. Bloklangan (isBlocked === true) xodimlar chiqmaydi.
 * 3. FAQAT ish haqida montaj belgilangan bo'lsa usta sifatida chiqadi:
 *    - salaryType === 'per_job' (Faqat montajbay)
 *    - salaryType === 'fixed_plus_job' (Oklad + Montajbay)
 *    - salaryType === 'hybrid' (Gibrid: Oklad + Sotuvdan foiz + Montajbay)
 *    - yoki commissionPerInstall > 0 (1 ta montaj uchun stavka kiritilgan)
 *
 * Agar xodim sof oklad ('fixed'), faqat foiz ('percentage') yoki oklad+foiz ('fixed_plus_percentage')
 * bo'lsa va montaj stavkasi yo'q bo'lsa (masalan Kassir / Menejer), uning ismi usta ro'yxatida chiqmaydi!
 */
export const isTechnicianWithMontaj = (emp: Employee | undefined | null): boolean => {
  if (!emp || emp.isBlocked) return false;

  // Admin usta sifatida belgilanmasin
  if (
    emp.id === 'emp-admin' ||
    emp.systemRole === 'admin' ||
    emp.role === 'Bosh Administrator' ||
    (emp.role && emp.role.toLowerCase().includes('admin'))
  ) {
    return false;
  }

  // Ish haqida montaj belgilanganligini tekshirish
  const hasMontajSalary =
    emp.salaryType === 'per_job' ||
    emp.salaryType === 'fixed_plus_job' ||
    emp.salaryType === 'hybrid' ||
    (typeof emp.commissionPerInstall === 'number' && emp.commissionPerInstall > 0);

  return Boolean(hasMontajSalary);
};

/**
 * Ustaning qaysi filialga tegishli ekanligini aniqlash
 */
export const getTechnicianBranchName = (emp: Employee, branches: Branch[] = []): string => {
  if (emp.branchName) return emp.branchName;
  if (emp.branchId) {
    const br = branches.find((b) => b.id === emp.branchId);
    if (br) return br.name;
  }
  return 'Asosiy filial';
};

export interface TechniciansByBranchResult {
  currentBranchTechs: Employee[];
  otherBranchTechs: Employee[];
  otherBranchesGrouped: Record<string, { branch: Branch; technicians: Employee[] }>;
}

/**
 * Xodimlarni joriy filial va boshqa filiallar ustalari guruhiga ajratish
 */
export const categorizeTechniciansByBranch = (
  allEmployees: Employee[],
  currentBranchId?: string | null,
  branches: Branch[] = []
): TechniciansByBranchResult => {
  const montajTechnicians = allEmployees.filter(isTechnicianWithMontaj);

  // Agar filial tanlanmagan bo'lsa, hammasi bitta ro'yxatda
  if (!currentBranchId) {
    return {
      currentBranchTechs: montajTechnicians,
      otherBranchTechs: [],
      otherBranchesGrouped: {}
    };
  }

  const currentBranchTechs: Employee[] = [];
  const otherBranchTechs: Employee[] = [];
  const otherBranchesGrouped: Record<string, { branch: Branch; technicians: Employee[] }> = {};

  montajTechnicians.forEach((tech) => {
    // Agar xodimning branchId si joriy filialga teng bo'lsa
    // Yoki uning branchId si belgilanmagan bo'lib, joriy filial asosiy (isMain) filial bo'lsa
    const isCurrent = tech.branchId === currentBranchId || (!tech.branchId && branches.find(b => b.id === currentBranchId)?.isMain);

    if (isCurrent) {
      currentBranchTechs.push(tech);
    } else {
      otherBranchTechs.push(tech);

      const brId = tech.branchId || 'other';
      const brObj: Branch = branches.find((b) => b.id === brId) || {
        id: brId,
        name: tech.branchName || 'Boshqa filial',
        code: 'OTH',
        isMain: false,
        status: 'active',
        address: ''
      };

      if (!otherBranchesGrouped[brId]) {
        otherBranchesGrouped[brId] = {
          branch: brObj,
          technicians: []
        };
      }
      otherBranchesGrouped[brId].technicians.push(tech);
    }
  });

  return {
    currentBranchTechs,
    otherBranchTechs,
    otherBranchesGrouped
  };
};
