#include <iostream>
#include <string>
#include <thread>
#include <cstdlib>

#if defined(_WIN32)
    #include <windows.h>
    #include <Lmcons.h>
#elif defined(__linux__) || defined(__APPLE__)
    #include <unistd.h>
    #include <sys/utsname.h>
    #include <pwd.h>
#endif

void printOSInfo() {
#if defined(_WIN32)
    std::cout << "Operating System: Windows" << std::endl;
#elif defined(__linux__)
    std::cout << "Operating System: Linux" << std::endl;
#elif defined(__APPLE__)
    std::cout << "Operating System: macOS" << std::endl;
#else
    std::cout << "Operating System: Unknown" << std::endl;
#endif
}

void printCPUInfo() {
    unsigned int cores = std::thread::hardware_concurrency();
    std::cout << "CPU Cores: " << cores << std::endl;
}

void printUserInfo() {
#if defined(_WIN32)
    char username[UNLEN + 1];
    DWORD username_len = UNLEN + 1;
    GetUserNameA(username, &username_len);
    std::cout << "Current User: " << username << std::endl;
#else
    struct passwd* pw = getpwuid(getuid());
    std::cout << "Current User: " << pw->pw_name << std::endl;
#endif
}

void printHostName() {
    char hostname[1024];
    hostname[1023] = '\0';
    gethostname(hostname, 1023);
    std::cout << "Hostname: " << hostname << std::endl;
}

void printRAMInfo() {
#if defined(_WIN32)
    MEMORYSTATUSEX status;
    status.dwLength = sizeof(status);
    GlobalMemoryStatusEx(&status);
    DWORDLONG totalPhys = status.ullTotalPhys;
    std::cout << "Total RAM: " << (totalPhys / (1024 * 1024)) << " MB" << std::endl;
#elif defined(__linux__) || defined(__APPLE__)
    long pages = sysconf(_SC_PHYS_PAGES);
    long page_size = sysconf(_SC_PAGE_SIZE);
    long long mem = static_cast<long long>(pages) * page_size;
    std::cout << "Total RAM: " << (mem / (1024 * 1024)) << " MB" << std::endl;
#else
    std::cout << "Total RAM: Unknown" << std::endl;
#endif
}

void printSystemInfo() {
    std::cout << "=== System Information ===" << std::endl;
    printOSInfo();
    printUserInfo();
    printHostName();
    printCPUInfo();
    printRAMInfo();
}

int main() {
    printSystemInfo();
    return 0;
}