'use client'

import { useState } from 'react'
import { type Organization, type OrganizationMember, type MemberRole } from '@/types/organization'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { UserPlus, MoreVertical, Shield, ShieldCheck, ShieldAlert } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['owner', 'admin', 'member']),
  title: z.string().optional(),
})

type InviteFormData = z.infer<typeof inviteSchema>

const roleIcons = {
  owner: <ShieldCheck className="h-4 w-4 text-primary" />,
  admin: <Shield className="h-4 w-4 text-primary" />,
  member: <ShieldAlert className="h-4 w-4 text-muted-foreground" />,
}

interface TeamManagementProps {
  organization: Organization
  members: OrganizationMember[]
  currentUserRole: MemberRole
  onInviteMember: (data: InviteFormData) => Promise<void>
  onUpdateMember: (memberId: string, role: MemberRole) => Promise<void>
  onRemoveMember: (memberId: string) => Promise<void>
}

export function TeamManagement({
  organization,
  members,
  currentUserRole,
  onInviteMember,
  onUpdateMember,
  onRemoveMember,
}: TeamManagementProps) {
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
  })

  const canManageMembers = currentUserRole === 'owner' || currentUserRole === 'admin'

  const handleInvite = async (data: InviteFormData) => {
    try {
      await onInviteMember(data)
      setIsInviteOpen(false)
      reset()
      toast.success('Invitation sent successfully')
    } catch (error) {
      toast.error('Failed to send invitation')
    }
  }

  const handleRoleChange = async (memberId: string, newRole: MemberRole) => {
    try {
      await onUpdateMember(memberId, newRole)
      toast.success('Member role updated successfully')
    } catch (error) {
      toast.error('Failed to update member role')
    }
  }

  const handleRemove = async (memberId: string) => {
    try {
      await onRemoveMember(memberId)
      toast.success('Member removed successfully')
    } catch (error) {
      toast.error('Failed to remove member')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Team Members</h2>
          <p className="text-sm text-muted-foreground">
            Manage your organization's team members and their roles.
          </p>
        </div>
        {canManageMembers && (
          <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
                <DialogDescription>
                  Send an invitation to join your organization.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(handleInvite)} className="space-y-4">
                <div className="space-y-2">
                  <Input
                    placeholder="Email address"
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Select
                    {...register('role')}
                    onValueChange={(value) => register('role').onChange({ target: { value } })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      {currentUserRole === 'owner' && (
                        <SelectItem value="owner">Owner</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {errors.role && (
                    <p className="text-sm text-destructive">{errors.role.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Input
                    placeholder="Job title (optional)"
                    {...register('title')}
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsInviteOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Sending...' : 'Send Invitation'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Members</CardTitle>
          <CardDescription>
            {members.length} member{members.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src="/placeholder-avatar.jpg" />
                    <AvatarFallback>
                      {member.title?.[0] || 'M'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{member.title}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="gap-1">
                        {roleIcons[member.role]}
                        {member.role}
                      </Badge>
                      {member.status === 'pending' && (
                        <Badge variant="outline">Pending</Badge>
                      )}
                    </div>
                  </div>
                </div>
                {canManageMembers && member.id !== currentUserRole && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleRoleChange(member.id, 'member')}
                        disabled={member.role === 'member'}
                      >
                        Make Member
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleRoleChange(member.id, 'admin')}
                        disabled={member.role === 'admin'}
                      >
                        Make Admin
                      </DropdownMenuItem>
                      {currentUserRole === 'owner' && (
                        <DropdownMenuItem
                          onClick={() => handleRoleChange(member.id, 'owner')}
                          disabled={member.role === 'owner'}
                        >
                          Transfer Ownership
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleRemove(member.id)}
                      >
                        Remove Member
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 