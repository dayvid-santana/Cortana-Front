import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateProject } from "@/features/projects/hooks/use-create-project";
import {
  addProjectSchema,
  type AddProjectFormValues,
} from "@/features/projects/schemas/add-project-schema";
import { toDisplayProblem } from "@/lib/api/errors";

interface AddProjectFormProps {
  onCreated?: (projectId: string) => void;
}

export function AddProjectForm({ onCreated }: AddProjectFormProps) {
  const createProject = useCreateProject();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    reset,
  } = useForm<AddProjectFormValues>({ resolver: zodResolver(addProjectSchema) });

  const onSubmit = handleSubmit(async (values) => {
    try {
      // An empty "name" field must be omitted, not sent as "" — the API
      // treats an absent name as "derive one from the path" but an empty
      // string is a valid (if useless) name and would be used verbatim.
      const created = await createProject.mutateAsync({
        path: values.path,
        ...(values.name ? { name: values.name } : {}),
      });
      reset();
      onCreated?.(created.id);
    } catch (error) {
      const problem = toDisplayProblem(error);
      setError("path", { message: problem.detail ?? problem.title });
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3" noValidate>
      <div className="flex flex-col gap-1">
        <label htmlFor="project-path" className="text-foreground text-[13px] font-medium">
          Repository path
        </label>
        <Input
          id="project-path"
          placeholder="/home/me/code/acme-api"
          aria-invalid={errors.path ? true : undefined}
          aria-describedby={errors.path ? "project-path-error" : undefined}
          {...register("path")}
        />
        {errors.path ? (
          <p id="project-path-error" role="alert" className="text-danger text-[12px]">
            {errors.path.message}
          </p>
        ) : (
          <p className="text-muted-foreground text-[12px]">
            The backend validates this path — DevMate never reads your filesystem from the browser.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="project-name" className="text-foreground text-[13px] font-medium">
          Display name (optional)
        </label>
        <Input id="project-name" placeholder="acme-api" {...register("name")} />
      </div>

      <Button type="submit" disabled={isSubmitting} className="self-start">
        {isSubmitting ? "Adding…" : "Add project"}
      </Button>
    </form>
  );
}
