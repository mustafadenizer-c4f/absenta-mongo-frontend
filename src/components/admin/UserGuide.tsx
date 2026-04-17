// src/components/admin/UserGuide.tsx — Full Application Manual (EN/TR)
import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useLanguage } from '../../contexts/LanguageContext';
import { BRAND } from '../../config/brand';

const Section: React.FC<{ title: string; defaultExpanded?: boolean; children: React.ReactNode }> = ({
  title, defaultExpanded = false, children,
}) => (
  <Accordion defaultExpanded={defaultExpanded} sx={{ mb: 1 }}>
    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
      <Typography variant="h6" fontWeight={600}>{title}</Typography>
    </AccordionSummary>
    <AccordionDetails>{children}</AccordionDetails>
  </Accordion>
);

const RoleChip: React.FC<{ label: string }> = ({ label }) => (
  <Chip label={label} size="small" color="primary" variant="outlined" sx={{ mr: 0.5, mb: 0.5 }} />
);

const Li: React.FC<{ text: string }> = ({ text }) => (
  <ListItem><ListItemText primary={text} /></ListItem>
);

const UserGuide: React.FC = () => {
  const { langPackLabel, language } = useLanguage();
  const t = language === 'tr';

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 1, color: 'primary.main', fontWeight: 600 }}>
        {langPackLabel("txtAppManual") || `${BRAND.name} — Application Manual`}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        {t ? `${BRAND.name} izin yönetim sistemi için tüm roller ve özellikler rehberi.` : `Complete guide for all roles and features in the ${BRAND.name} employee leave management system.`}
      </Typography>

      {/* ── Quick Start ── */}
      <Section title={t ? '🚀 Hızlı Başlangıç Rehberi' : '🚀 Quick Start Guide'} defaultExpanded>
        <Typography variant="body2" sx={{ mb: 2 }}>
          {t ? 'Şirketinizi ilk kez kurarken bu adımları sırasıyla takip edin. Sıralama önemlidir — her adım bir öncekine bağlıdır.' : 'Follow these steps in order when setting up your company for the first time. The order matters — each step depends on the previous one.'}
        </Typography>
        <Alert severity="warning" sx={{ mb: 2 }}>
          {t ? 'Bu adımları sırasıyla tamamlayın. Örneğin, henüz oluşturulmamış bir takıma kullanıcı atayamazsınız.' : 'Complete these steps in order. For example, you cannot assign a user to a team that doesn\'t exist yet.'}
        </Alert>

        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>{t ? 'Adım 1: Hiyerarşinizi Seçin' : 'Step 1: Choose Your Hierarchy'}</Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          {t ? 'Ayarlar → Organizasyon bölümüne gidin ve hiyerarşi profilinizi seçin (Düz, Takımlar, Departmanlar veya Gruplar). Daha sonra yükseltebilirsiniz ancak düşüremezsiniz.' : 'Go to Settings → Organization and select your hierarchy profile (Flat, Teams, Departments, or Groups). You can upgrade later but not downgrade.'}
        </Typography>

        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>{t ? 'Adım 2: Organizasyon Yapısını Oluşturun' : 'Step 2: Create Organizational Structure'}</Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          {t ? 'Seçtiğiniz hiyerarşiye göre yapınızı yukarıdan aşağıya oluşturun:' : 'Build your structure top-down based on your chosen hierarchy:'}
        </Typography>
        <List dense>
          <Li text={t ? 'Gruplar profili → Önce Gruplar, sonra Departmanlar, sonra Takımlar' : 'Groups profile → Create Groups first, then Departments, then Teams'} />
          <Li text={t ? 'Departmanlar profili → Önce Departmanlar, sonra Takımlar' : 'Departments profile → Create Departments first, then Teams'} />
          <Li text={t ? 'Takımlar profili → Doğrudan Takımlar oluşturun' : 'Teams profile → Create Teams directly'} />
          <Li text={t ? 'Düz profil → Bu adımı atlayın' : 'Flat profile → Skip this step'} />
        </List>

        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>{t ? 'Adım 3: İzin Türlerini Gözden Geçirin' : 'Step 3: Review Leave Types'}</Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          {t ? 'Varsayılan izin türleri otomatik oluşturulur. Kullanıcı eklemeden önce İzin Türleri sayfasından düzenleyin.' : 'Default leave types are created automatically. Go to Leave Types to review and edit before creating users.'}
        </Typography>

        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>{t ? 'Adım 4: Tatilleri Ekleyin' : 'Step 4: Add Holidays'}</Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          {t ? 'Tatiller sayfasına gidin ve resmi tatilleri ekleyin. Gün hesaplamaları doğru olması için bunu izin taleplerinden önce yapın.' : 'Go to Holidays and add public holidays. Do this before employees start requesting leave so day calculations are accurate.'}
        </Typography>

        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>{t ? 'Adım 5: Önce Yöneticileri Oluşturun' : 'Step 5: Create Managers First'}</Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          {t ? 'Kullanıcılar sayfasından önce yöneticileri oluşturun. Böylece personel oluştururken doğru yöneticiyi atayabilirsiniz.' : 'Go to Users and create managers before creating staff, so you can assign the correct manager immediately.'}
        </Typography>
        <Alert severity="info" sx={{ mb: 2 }}>
          {t ? 'İpucu: Kullanıcıları şu sırayla oluşturun — departman/grup yöneticileri → takım yöneticileri → personel.' : 'Tip: Create users in this order — department/group managers → team managers → staff.'}
        </Alert>

        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>{t ? 'Adım 6: Personel Oluşturun' : 'Step 6: Create Staff Members'}</Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          {t ? 'Her kullanıcı için takım, yönetici, işe giriş tarihi ve doğum tarihi belirleyin. Varsayılan şifre: Pp123456 — ilk girişte değiştirilmelidir.' : 'For each user, set team, manager, hire date, and birth date. Default password is Pp123456 — must be changed on first login.'}
        </Typography>

        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>{t ? 'Adım 7: İş Günlerini Yapılandırın (İsteğe Bağlı)' : 'Step 7: Configure Workdays (Optional)'}</Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          {t ? 'Ayarlar → İş Günleri bölümünden çalışma, resmi iş günü ve tatil günlerini yapılandırın.' : 'Go to Settings → Workdays to configure working days, legal workdays, and rest days.'}
        </Typography>

        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>{t ? 'Adım 8: E-posta Ayarlayın (İsteğe Bağlı)' : 'Step 8: Set Up Email (Optional)'}</Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          {t ? 'Ayarlar → E-posta bölümünden SMTP yapılandırmasını yapın.' : 'Go to Settings → Email to configure SMTP for email notifications.'}
        </Typography>

        <Alert severity="success" sx={{ mt: 1 }}>
          {t ? 'Hepsi bu kadar! Şirketiniz hazır. Çalışanlar giriş yapabilir, izin talep edebilir ve yöneticiler onaylayabilir.' : 'That\'s it! Your company is ready. Employees can now log in, request leave, and managers can approve them.'}
        </Alert>
      </Section>

      {/* ── Overview ── */}
      <Section title={t ? '1. Genel Bakış' : '1. Overview'} defaultExpanded>
        <Typography variant="body2" sx={{ mb: 2 }}>
          {t ? `${BRAND.name}, birden fazla organizasyon hiyerarşisi ve rolü destekleyen bir izin yönetim uygulamasıdır. İzin talepleri, onaylar, bakiye takibi, toplu izin ve takım takvimleri yönetir.` : `${BRAND.name} is a employee leave management application that supports multiple organizational hierarchies and roles. It handles leave requests, approvals, balance tracking, collective leave, and team calendars.`}
        </Typography>
        <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>{t ? 'Desteklenen Roller' : 'Supported Roles'}</Typography>
        <List dense>
          <ListItem><ListItemText primary={t ? 'Personel' : 'Staff'} secondary={t ? 'Normal çalışanlar — izin talep eder, bakiye ve geçmişi görüntüler' : 'Regular employees — request leave, view balances and history'} /></ListItem>
          <ListItem><ListItemText primary={t ? 'Yönetici (Takım Yöneticisi)' : 'Manager (Team Manager)'} secondary={t ? 'Doğrudan raporları yönetir — izin onaylar, takım takvimi ve bakiyelerini görür' : 'Manages direct reports — approves leave, views team calendar and balances'} /></ListItem>
          <ListItem><ListItemText primary={t ? 'Grup Yöneticisi' : 'Group Manager'} secondary={t ? 'Bir grup takımı yönetir — grup üyeleri için izin onaylar' : 'Manages a group of teams — approves leave for group members'} /></ListItem>
          <ListItem><ListItemText primary={t ? 'Departman Yöneticisi' : 'Department Manager'} secondary={t ? 'Tüm departmanı yönetir — izin onaylar, departmandaki tüm takımları görür' : 'Manages an entire department — approves leave, views all teams in the department'} /></ListItem>
          <ListItem><ListItemText primary={t ? 'Admin' : 'Admin'} secondary={t ? 'Tam sistem erişimi — kullanıcılar, izin türleri, tatiller, ayarlar ve şirket geneli takvim yönetir' : 'Full system access — manages users, leave types, holidays, settings, and company-wide calendar'} /></ListItem>
          <ListItem><ListItemText primary={t ? 'Süpervizör' : 'Supervisor'} secondary={t ? 'Süper yönetici — birden fazla şirketi yönetir' : 'Super-admin — manages multiple companies'} /></ListItem>
        </List>
      </Section>

      {/* ── Staff Features ── */}
      <Section title={t ? '2. Personel Özellikleri' : '2. Staff Features'}>
        <Box sx={{ mb: 1 }}><RoleChip label={t ? 'Personel' : 'Staff'} /><RoleChip label={t ? 'Yönetici' : 'Manager'} /><RoleChip label={t ? 'Grup Yöneticisi' : 'Group Manager'} /><RoleChip label={t ? 'Departman Yöneticisi' : 'Dept. Manager'} /></Box>
        <Typography variant="body2" sx={{ mb: 2 }}>
          {t ? 'Tüm çalışanlar (yöneticiler dahil) bu kişisel özelliklere erişebilir.' : 'All employees (including managers) have access to these personal features.'}
        </Typography>
        <Typography variant="subtitle2" fontWeight={600}>{t ? 'Panel' : 'Dashboard'}</Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          {t ? 'Kişisel izin bakiyelerinizi gösterir. Yıllık izin hakkı, işe giriş tarihi ve kıdeme göre Türk iş hukukuna uygun hesaplanır.' : 'Shows your personal leave balances. Annual leave entitlement is calculated based on Turkish labor law using your hire date and seniority.'}
        </Typography>
        <Typography variant="subtitle2" fontWeight={600}>{t ? 'İzin Talebi' : 'Request Leave'}</Typography>
        <List dense>
          <Li text={t ? 'İzin türü, başlangıç/bitiş tarihi ve isteğe bağlı neden seçin' : 'Select leave type, start/end dates, and optionally a reason'} />
          <Li text={t ? 'Yarım gün izin desteklenir (sabah veya öğleden sonra)' : 'Half-day leave is supported (morning or afternoon)'} />
          <Li text={t ? 'Hafta sonları ve resmi tatiller gün sayısından otomatik çıkarılır' : 'Weekends and public holidays are automatically excluded from the day count'} />
          <Li text={t ? 'Gönderim öncesi kalan bakiyeniz gösterilir' : 'Your remaining balance is shown before submission'} />
        </List>
        <Typography variant="subtitle2" fontWeight={600}>{t ? 'İzin Geçmişi' : 'Leave History'}</Typography>
        <List dense>
          <Li text={t ? 'Tüm geçmiş ve mevcut izin taleplerinizi görüntüleyin' : 'View all your past and current leave requests'} />
          <Li text={t ? 'Durum, izin türü ve tarih aralığına göre filtreleyin' : 'Filter by status, leave type, and date range'} />
          <Li text={t ? 'Bekleyen talepleri iptal edin' : 'Cancel pending requests'} />
        </List>
        <Typography variant="subtitle2" fontWeight={600}>{t ? 'Takvim' : 'Calendar'}</Typography>
        <Typography variant="body2">
          {t ? 'Onaylanan/bekleyen izinlerinizi ve şirket tatillerini gösteren kişisel takvim. Ay, hafta, gün görünümleri ve 3 aylık genel bakış desteklenir.' : 'Personal calendar showing your approved/pending leave and company holidays. Supports month, week, day views and a 3-month overview.'}
        </Typography>
      </Section>

      {/* ── Manager Features ── */}
      <Section title={t ? '3. Yönetici Özellikleri' : '3. Manager Features'}>
        <Box sx={{ mb: 1 }}><RoleChip label={t ? 'Yönetici' : 'Manager'} /></Box>
        <Typography variant="subtitle2" fontWeight={600}>{t ? 'Onaylar' : 'Approvals'}</Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          {t ? 'Doğrudan raporlarınızdan gelen izin taleplerini görüntüleyin ve onaylayın/reddedin.' : 'View and approve/reject leave requests from your direct reports.'}
        </Typography>
        <Typography variant="subtitle2" fontWeight={600}>{t ? 'Takım Takvimi' : 'Team View (Calendar)'}</Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          {t ? 'Tüm doğrudan raporların izinlerini gösteren takvim. Çakışma tarihleri kırmızı ile vurgulanır.' : 'Calendar showing all direct reports\' leave. Conflict dates are highlighted in red.'}</Typography>
        <Typography variant="subtitle2" fontWeight={600}>{t ? 'Takım Bakiyeleri' : 'Team Balances'}</Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          {t ? 'Tüm doğrudan raporların izin bakiyelerini gösteren tablo.' : 'Table showing leave balances for all direct reports.'}
        </Typography>
      </Section>

      {/* ── Group / Dept Manager ── */}
      <Section title={t ? '4. Grup Yöneticisi Özellikleri' : '4. Group Manager Features'}>
        <Box sx={{ mb: 1 }}><RoleChip label={t ? 'Grup Yöneticisi' : 'Group Manager'} /></Box>
        <Typography variant="body2" sx={{ mb: 2 }}>
          {t ? 'Yönetici özellikleriyle aynı, ancak gruptaki tüm üyelere (birden fazla takım) kapsamlıdır.' : 'Same as Manager features but scoped to all members in the group (across multiple teams).'}
        </Typography>
      </Section>

      <Section title={t ? '5. Departman Yöneticisi Özellikleri' : '5. Department Manager Features'}>
        <Box sx={{ mb: 1 }}><RoleChip label={t ? 'Departman Yöneticisi' : 'Department Manager'} /></Box>
        <Typography variant="body2" sx={{ mb: 2 }}>
          {t ? 'Yönetici özellikleriyle aynı, ancak tüm departmana (departmandaki tüm takımlar) kapsamlıdır.' : 'Same as Manager features but scoped to the entire department (all teams within the department).'}
        </Typography>
      </Section>

      {/* ── Admin Features ── */}
      <Section title={t ? '6. Admin Özellikleri' : '6. Admin Features'}>
        <Box sx={{ mb: 1 }}><RoleChip label="Admin" /></Box>
        <Typography variant="subtitle2" fontWeight={600}>{t ? 'Kullanıcı Yönetimi' : 'User Management'}</Typography>
        <List dense>
          <Li text={t ? 'Kullanıcı Yönetimi sayfasından yeni kullanıcı ekleyin — varsayılan şifre: Pp123456' : 'Add new users — default password: Pp123456 (must be changed on first login)'} />
          <Li text={t ? 'Kullanıcı profillerini düzenleyin: ad, rol, işe giriş tarihi, doğum tarihi, takım, yönetici' : 'Edit user profiles: name, role, hire date, birth date, team, manager'} />
        </List>
        <Typography variant="subtitle2" fontWeight={600}>{t ? 'Organizasyon Yapısı' : 'Organization Structure'}</Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          {t ? 'Hiyerarşi profiline bağlı olarak kenar çubuğundan Takımlar, Departmanlar ve Grupları yönetebilirsiniz.' : 'Depending on the hierarchy profile, you can manage Teams, Departments, and Groups from the sidebar.'}
        </Typography>
        <Typography variant="subtitle2" fontWeight={600}>{t ? 'İzin Türleri' : 'Leave Types'}</Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          {t ? 'İzin türlerini oluşturun ve yönetin. Her türün adı, varsayılan gün sayısı, renk kodu ve aktif/pasif durumu vardır.' : 'Create and manage leave types. Each type has a name, default days, color code, and active/inactive status.'}
        </Typography>
        <Typography variant="subtitle2" fontWeight={600}>{t ? 'Tatiller' : 'Holidays'}</Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          {t ? 'Şirket tatillerini tanımlayın. İzin günü hesaplanırken otomatik olarak çıkarılır.' : 'Define company holidays. These are automatically excluded when calculating leave days.'}
        </Typography>
        <Typography variant="subtitle2" fontWeight={600}>{t ? 'Toplu İzin' : 'Collective Leave'}</Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          {t ? 'Şirket geneli izin günleri planlayın. Tüm uygun çalışanlar için otomatik onaylı izin talebi oluşturur.' : 'Schedule company-wide leave days. Automatically creates approved leave requests for all eligible employees.'}
        </Typography>
        <Typography variant="subtitle2" fontWeight={600}>{t ? 'Ayarlar' : 'Settings'}</Typography>
        <Typography variant="body2">
          {t ? 'Şirket ayarlarını, organizasyon hiyerarşisini, iş günlerini ve e-posta yapılandırmasını yönetin.' : 'Configure company settings, organizational hierarchy, workdays, and email.'}
        </Typography>
      </Section>

      {/* ── Turkish Annual Leave Law ── */}
      <Section title={t ? '7. Türk Yıllık İzin Kanunu (Hak Hesaplama)' : '7. Turkish Annual Leave Law (Entitlement Calculation)'}>
        <Typography variant="body2" sx={{ mb: 2 }}>
          {t ? 'Yıllık izin hakkı, Türk İş Kanunu (Madde 53) esas alınarak otomatik hesaplanır.' : 'Annual leave entitlement is automatically calculated based on Turkish Labor Law (Article 53).'}
        </Typography>
        <List dense>
          <Li text={t ? '1–5 yıl hizmet → 14 gün' : '1–5 years of service → 14 days'} />
          <Li text={t ? '5–15 yıl hizmet → 20 gün' : '5–15 years of service → 20 days'} />
          <Li text={t ? '15+ yıl hizmet → 26 gün' : '15+ years of service → 26 days'} />
          <Li text={t ? '18 yaş altı veya 50 yaş üstü çalışanlar → minimum 20 gün' : 'Employees under 18 or over 50 → minimum 20 days'} />
        </List>
        <Alert severity="info" sx={{ mt: 1 }}>
          {t ? 'Kıdem, işe giriş tarihinden hesaplanır. Yaşa dayalı düzeltmeler doğum tarihini kullanır. Doğru hesaplama için her iki alan da doldurulmalıdır.' : 'Seniority is calculated from the hire date. Age-based adjustments use the birth date. Both fields must be set for accurate calculation.'}
        </Alert>
      </Section>

      {/* ── Tips ── */}
      <Section title={t ? '8. İpuçları ve En İyi Uygulamalar' : '8. Tips & Best Practices'}>
        <List dense>
          <Li text={t ? 'Çalışanlar için her zaman işe giriş tarihi ve doğum tarihi belirleyin — hak hesaplamaları bunlara bağlıdır' : 'Always set hire date and birth date for employees — these drive entitlement calculations'} />
          <Li text={t ? 'Her yılın başında tatilleri tanımlayın, böylece izin günü hesaplamaları doğru olur' : 'Define holidays before the start of each year so leave day calculations are accurate'} />
          <Li text={t ? 'Toplu izni dikkatli kullanın — herkesin yıllık bakiyesinden düşer' : 'Use collective leave sparingly — it deducts from everyone\'s annual balance'} />
          <Li text={t ? 'Çakışmalar için Takım Takvimini düzenli kontrol edin (kırmızı ile vurgulanır)' : 'Check the Team Calendar regularly for scheduling conflicts (highlighted in red)'} />
          <Li text={t ? 'Yöneticiler bekleyen onayları hızlıca incelemelidir' : 'Managers should review pending approvals promptly to avoid bottlenecks'} />
        </List>
      </Section>
    </Box>
  );
};

export default UserGuide;
