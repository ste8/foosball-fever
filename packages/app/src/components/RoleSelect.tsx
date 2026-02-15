import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RoleIcon } from "@/components/RoleIcon";
import type { Role } from "@/types";

const NONE_VALUE = "__none__";

export function RoleSelect({
  value,
  onChange,
  disabled,
}: {
  value?: Role;
  onChange: (role?: Role) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <Select
      value={value ?? NONE_VALUE}
      onValueChange={(v) => onChange(v === NONE_VALUE ? undefined : (v as Role))}
      disabled={disabled}
    >
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE_VALUE}>{t("roles.noPreference")}</SelectItem>
        <SelectItem value="defender">
          <span className="flex items-center gap-2">
            <RoleIcon role="defender" />
            {t("roles.defender")}
          </span>
        </SelectItem>
        <SelectItem value="attacker">
          <span className="flex items-center gap-2">
            <RoleIcon role="attacker" />
            {t("roles.attacker")}
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
