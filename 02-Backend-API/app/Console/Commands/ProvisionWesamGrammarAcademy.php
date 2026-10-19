<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\Provisioning\WesamGrammarAcademyProvisioner;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;

class ProvisionWesamGrammarAcademy extends Command
{
    protected $signature = 'ain:provision-wesam-academy
                            {--email=wesam@ainplatform.com : Verified login email}
                            {--rotate-password : Rotate the owner password}
                            {--qa-session : Do not require a password change after this provisioning run}';

    protected $description = 'Provision or reconcile the private Wesam Arabic Grammar Academy workspace.';

    public function handle(WesamGrammarAcademyProvisioner $provisioner): int
    {
        $email = (string) $this->option('email');
        $rotate = (bool) $this->option('rotate-password');
        $existing = User::query()->where('normalized_email', mb_strtolower(trim($email)))->exists();
        $password = null;

        if (! $existing || $rotate) {
            $password = (string) $this->secret('Temporary password (input is hidden)');
            $validator = Validator::make(['password' => $password], [
                'password' => ['required', 'string', 'min:14', 'regex:/[a-z]/', 'regex:/[A-Z]/', 'regex:/[0-9]/', 'regex:/[^A-Za-z0-9]/'],
            ]);
            if ($validator->fails()) {
                $this->error('Password must contain 14+ characters, uppercase, lowercase, a number, and a symbol.');

                return self::FAILURE;
            }
        }

        $result = $provisioner->provision(
            $email,
            $password,
            $rotate,
            ! (bool) $this->option('qa-session'),
        );

        $this->info('Wesam Grammar Academy provisioning completed.');
        $this->table(['Field', 'Value'], collect($result)->map(fn ($value, $key): array => [
            $key,
            is_bool($value) ? ($value ? 'yes' : 'no') : (string) $value,
        ])->values()->all());
        $this->warn('No password was printed or persisted by this command.');

        return self::SUCCESS;
    }
}
