<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class CreateSuperAdminCommand extends Command
{
    protected $signature = 'ain:super-admin:create
                            {--email= : The email of the super administrator}
                            {--name= : The full name of the super administrator}
                            {--password= : Secure password (if omitted, will prompt or generate)}
                            {--force-change : Require password change on first login}';

    protected $description = 'Provision or promote a secure platform Super Administrator account.';

    public function handle(): int
    {
        $this->newLine();
        $this->line('===========================================================');
        $this->line('       AIN PLATFORM — SUPER ADMIN SECURE PROVISIONING       ');
        $this->line('===========================================================');

        $email = $this->option('email') ?: $this->ask('Enter Super Admin email:');
        $email = mb_strtolower(trim((string) $email));

        $validator = Validator::make(['email' => $email], [
            'email' => ['required', 'string', 'email:rfc,dns'],
        ]);

        if ($validator->fails()) {
            $this->error('Validation error: '.$validator->errors()->first('email'));

            return self::FAILURE;
        }

        $name = $this->option('name') ?: $this->ask('Enter Super Admin full name:', 'Platform Administrator');
        $name = trim((string) $name);

        $password = (string) $this->option('password');
        $generated = false;

        if ($password === '') {
            if ($this->input->isInteractive()) {
                $password = (string) $this->secret('Enter Super Admin password (min 12 chars, leave empty to generate):');
            }
            if ($password === '') {
                $password = Str::password(18, true, true, false, false);
                $generated = true;
            }
        }

        if (strlen($password) < 12) {
            $this->error('Security requirement: Password must be at least 12 characters.');

            return self::FAILURE;
        }

        $forceChange = (bool) $this->option('force-change') || $generated;

        $user = User::query()->where('normalized_email', $email)->first();

        if ($user) {
            $user->forceFill([
                'name' => $name ?: $user->name,
                'password' => Hash::make($password),
                'platform_role' => 'super_admin',
                'email_verified_at' => $user->email_verified_at ?? now(),
                'must_change_password' => $forceChange,
            ])->save();

            $this->info("Successfully promoted existing user [{$email}] to Super Admin.");
        } else {
            $user = User::query()->create([
                'name' => $name,
                'email' => $email,
                'normalized_email' => $email,
                'password' => Hash::make($password),
                'platform_role' => 'super_admin',
                'email_verified_at' => now(),
                'must_change_password' => $forceChange,
            ]);

            $this->info("Successfully created new Super Admin account [{$email}].");
        }

        if ($generated) {
            $this->warn('NOTE: A temporary password was generated. Securely copy it now; it will not be displayed again:');
            $this->line("Temporary Password: {$password}");
        }

        if ($forceChange) {
            $this->comment('Account flagged: User must change password upon first successful login.');
        }

        $this->newLine();

        return self::SUCCESS;
    }
}
